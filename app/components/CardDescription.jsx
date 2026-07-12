"use client";

import { useState } from "react";

export default function CardDescription({ desc }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!desc) return null;

  // 120 characters is approximately 2 lines of description on 300px wide cards.
  const isLong = desc.length > 120;

  return (
    <div className="product-desc-container">
      <p className={`product-desc ${(!isExpanded && isLong) ? "clamped" : ""}`}>
        {desc}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="read-more-btn"
        >
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
}
