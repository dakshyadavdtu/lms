import React, { useState } from "react";
import { FaStar } from "react-icons/fa6";
import { FaRegStar } from "react-icons/fa";

const getInitial = (name) => {
  const letter = name?.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
};

const ReviewCard = ({ text, name, image, rating, role }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = !image || imgFailed;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 max-w-sm w-full">
      <div className="flex items-center mb-3 text-yellow-400 text-sm">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <span key={i}>
              {i < rating ? <FaStar /> : <FaRegStar />}
            </span>
          ))}
      </div>

      <p className="text-gray-700 text-sm mb-5">{text}</p>

      <div className="flex items-center gap-3">
        {showFallback ? (
          <div
            className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0"
            aria-hidden
          >
            {getInitial(name)}
          </div>
        ) : (
          <img
            src={image}
            alt={name || "Reviewer"}
            className="w-10 h-10 rounded-full object-cover shrink-0"
            onError={() => setImgFailed(true)}
          />
        )}
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{name || "Anonymous"}</h4>
          <p className="text-xs text-gray-500">{role ?? ""}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
