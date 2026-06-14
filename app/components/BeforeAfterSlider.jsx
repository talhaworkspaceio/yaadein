"use client";

import { useState, useRef, useEffect } from "react";

export default function BeforeAfterSlider({ before, after, labelBefore = "Before", labelAfter = "After" }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4/3",
        overflow: "hidden",
        borderRadius: "var(--radius, 12px)",
        border: "1.5px solid var(--border2, rgba(181, 139, 92, 0.28))",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.8)",
        cursor: "ew-resize",
        userSelect: "none",
        backgroundColor: "#080605"
      }}
    >
      {/* After Image (Background) */}
      <img
        src={after}
        alt={labelAfter}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
          display: "block"
        }}
      />

      {/* Before Image (Overlay clipped) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          pointerEvents: "none",
          zIndex: 2
        }}
      >
        <img
          src={before}
          alt={labelBefore}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
        />
      </div>

      {/* Slider Line Separator */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: "2px",
          backgroundColor: "#dfc38a",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
          boxShadow: "0 0 10px rgba(0,0,0,0.6)"
        }}
      >
        {/* Handle Button */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#1c0f07",
            border: "2px solid #dfc38a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dfc38a",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.6)",
            zIndex: 11
          }}
        >
          ↔
        </div>
      </div>

      {/* Badges / Labels */}
      <span
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          backgroundColor: "rgba(12, 10, 8, 0.75)",
          color: "#F4EFE6",
          padding: "4px 8px",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-typewriter, monospace)",
          borderRadius: "4px",
          zIndex: 12,
          border: "1px solid rgba(181, 139, 92, 0.3)",
          backdropFilter: "blur(4px)"
        }}
      >
        {labelBefore}
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          backgroundColor: "rgba(12, 10, 8, 0.75)",
          color: "#dfc38a",
          padding: "4px 8px",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-typewriter, monospace)",
          borderRadius: "4px",
          zIndex: 12,
          border: "1px solid rgba(212, 175, 55, 0.3)",
          backdropFilter: "blur(4px)"
        }}
      >
        {labelAfter}
      </span>
    </div>
  );
}
