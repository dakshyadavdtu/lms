import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Course from "../models/courseModel.js";
dotenv.config();

const DEBUG_LOG_ENDPOINT = "http://127.0.0.1:7243/ingest/0af5a546-cdc8-4764-a797-7707372f27a3";

const normalizeQuery = (q) => (q || "").toLowerCase().trim();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const synonymMap = {
  ml: ["ml", "machine learning"],
  "machine learning": ["machine learning", "ml"],
  ai: ["ai", "artificial intelligence"],
  "artificial intelligence": ["artificial intelligence", "ai"],
  ds: ["ds", "data science"],
  "data science": ["data science", "ds"],
};

const buildExpandedPattern = (q) => {
  const norm = normalizeQuery(q);
  if (!norm) return "";
  const synonyms = synonymMap[norm];
  if (!synonyms) {
    return escapeRegex(norm);
  }
  const escaped = synonyms.map(escapeRegex);
  return escaped.join("|");
};


export const searchWithAi = async (req,res) => {

    try {
         const { input } = req.body;
     
    if (!input) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const normalizedInput = normalizeQuery(input);

    // --- Use Gemini ONLY for intent extraction (topic + level) ---
    let extractedTopic = normalizedInput;
    let extractedLevel = null;
    try {
      const ai = new GoogleGenAI({});
      const prompt = `You are an intent extraction helper for an LMS course search API.
User will type a free-form query describing what they want to learn.
You MUST respond with a single JSON object ONLY, no extra text, in this exact shape:
{ "topic": "<short topic keyword>", "level": "<Beginner|Intermediate|Advanced|\"\">"}

Rules:
- "topic" should be a short keyword like "ml", "machine learning", "ai", "data science", "web development", etc.
- "level" must be one of: "Beginner", "Intermediate", "Advanced", or an empty string "" if level is not clear.
- Do NOT include explanations or markdown, ONLY the JSON object.

Query: "${input}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const raw = typeof response.text === "function" ? response.text() : response.text;
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // If Gemini wrapped JSON in extra text, try to extract the JSON substring
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (parsed && typeof parsed === "object") {
        if (parsed.topic) {
          extractedTopic = normalizeQuery(parsed.topic);

          // Normalize Gemini topic to known domain tokens (minimal guard)
          if (extractedTopic.includes("machine learning")) {
            extractedTopic = "ml";
          } else if (extractedTopic.includes("ml")) {
            extractedTopic = "ml";
          } else if (extractedTopic.includes("ai")) {
            extractedTopic = "ai";
          } else if (extractedTopic.includes("data science") || extractedTopic.includes("ds")) {
            extractedTopic = "ds";
          } else if (extractedTopic.includes("web development") || extractedTopic.includes("web dev")) {
            extractedTopic = "web development";
          }
        }
        if (typeof parsed.level === "string" && parsed.level.trim()) {
          extractedLevel = parsed.level.trim();
        }
      }

      // #region agent log
      fetch(DEBUG_LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "ai-search",
          hypothesisId: "gemini-intent",
          location: "aiController.js:searchWithAi:afterGemini",
          message: "Gemini intent extracted",
          data: { input, normalizedInput, extractedTopic, extractedLevel, raw },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } catch (intentError) {
      // If Gemini fails, fall back to normalized input only
      fetch(DEBUG_LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "ai-search",
          hypothesisId: "gemini-failure",
          location: "aiController.js:searchWithAi:geminiError",
          message: "Gemini intent extraction failed",
          data: { input, normalizedInput, error: String(intentError) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }

    // Final fallback: scan original normalized input for known domain tokens
    if (!extractedTopic || extractedTopic === "course") {
      if (normalizedInput.includes("machine learning") || normalizedInput.includes("ml")) {
        extractedTopic = "ml";
      } else if (normalizedInput.includes("artificial intelligence") || normalizedInput.includes("ai")) {
        extractedTopic = "ai";
      } else if (normalizedInput.includes("data science") || normalizedInput.includes("ds")) {
        extractedTopic = "ds";
      } else if (normalizedInput.includes("web development") || normalizedInput.includes("web dev") || normalizedInput.includes("web")) {
        extractedTopic = "web development";
      }
    }

    // Build regex using extractedTopic + synonym logic
    const expandedInputPattern = buildExpandedPattern(extractedTopic);
    let inputPattern = expandedInputPattern || escapeRegex(extractedTopic);

    // Final safety-net: always include domain keywords from original input
    let safetyPattern = "";
    if (normalizedInput.includes("machine learning") || normalizedInput.includes("ml")) {
      safetyPattern = buildExpandedPattern("ml");
    } else if (normalizedInput.includes("artificial intelligence") || normalizedInput.includes("ai")) {
      safetyPattern = buildExpandedPattern("ai");
    } else if (normalizedInput.includes("data science") || normalizedInput.includes("ds")) {
      safetyPattern = buildExpandedPattern("ds");
    } else if (
      normalizedInput.includes("web development") ||
      normalizedInput.includes("web dev") ||
      normalizedInput.includes("web")
    ) {
      safetyPattern = buildExpandedPattern("web development");
    }

    if (safetyPattern) {
      // Avoid leading '|' when base pattern is empty
      inputPattern = inputPattern ? `${inputPattern}|${safetyPattern}` : safetyPattern;
    }

    const inputRegex = new RegExp(inputPattern, "i");

    // Optional level filter (exact, case-insensitive) if Gemini provided one
    const levelFilter =
      extractedLevel && extractedLevel.trim()
        ? { level: new RegExp(`^${escapeRegex(extractedLevel.trim())}$`, "i") }
        : {};

    // #region agent log
    fetch(DEBUG_LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "ai-search",
        hypothesisId: "normalized-search",
        location: "aiController.js:searchWithAi:beforeQuery",
        message: "AI search built patterns",
        data: { input, normalizedInput, extractedTopic, extractedLevel, inputPattern, levelFilterApplied: !!extractedLevel },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const courses = await Course.find({
      isPublished: true,
      ...levelFilter,
      $or: [
        { title:      { $regex: inputRegex } },
        { subTitle:   { $regex: inputRegex } },
        { description:{ $regex: inputRegex } },
        { category:   { $regex: inputRegex } },
        { level:      { $regex: inputRegex } },
      ],
    });

    return res.status(200).json(courses);


    } catch (error) {
        console.log(error)
    }
}