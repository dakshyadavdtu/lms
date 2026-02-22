import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Could not delete temp file:", filePath, err);
  }
};

const uploadOnCloudinary = async (filePath) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  try {
    if (!filePath) return null;
    const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });
    safeUnlink(filePath);
    return uploadResult.secure_url;
  } catch (error) {
    safeUnlink(filePath);
    console.error("Cloudinary upload error:", error);
    throw new Error(error?.message ?? "Video upload failed");
  }
};

export default uploadOnCloudinary;
