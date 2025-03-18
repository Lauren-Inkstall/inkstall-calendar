import React, { useRef, useState } from "react";
import { Clock } from "lucide-react";
import attendanceSound from "../../sounds/attendance.mp3";
import { Link, useNavigate } from "react-router-dom";

const InkstallButton = ({ texts, btnColor, visibility, onClick, w, h, link }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const buttonRadius = "1rem";

  const navigate = useNavigate();

  // Calculate darker shade for bottom border
  const getDarkerShade = (color) => {
    const darkenAmount = 20;
    const hex = color.replace("#", "");
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - darkenAmount);
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - darkenAmount);
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - darkenAmount);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const handleClick = async () => {
    setIsPressed(true);
    try {
      setLoading(true);
      setError("");

      // Play sound
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch((error) => console.error("Audio play failed", error));
      }

      // Call the provided onClick handler
      if (onClick) {
        await onClick();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsPressed(false);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        transform: `translateY(${isPressed ? "2px" : "0"})`,
        transition: "transform 0.1s ease-in-out",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onClick={() => {
        if (link) {
          navigate(link);
        }
      }}
    >
      <button
        style={{
          position: "relative",
          width: w,
          height: h,
          borderRadius: buttonRadius,
          fontSize: "24px",
          fontWeight: "bold",
          outline: "none",
          border: "none",
          cursor: "pointer",
          color: "#fff",
          background: "transparent",
          padding: 0,
        }}
        onClick={handleClick}
        disabled={loading}
      >
        {/* Bottom layer for 3D effect */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: 0,
            width: "100%",
            height: "100%",
            background: getDarkerShade(btnColor),
            borderRadius: buttonRadius,
            transition: "all 0.2s ease",
          }}
        />

        {/* Top layer with content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.75rem",
            background: btnColor,
            borderRadius: buttonRadius,
            height: "100%",
            width: "100%",
            transform: `translateY(${isPressed ? "0" : "-4px"})`,
            transition: "all 0.2s ease",
            boxShadow: isHovered ? "0 5px 15px rgba(0,0,0,0.2)" : "none",
          }}
        >
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {visibility && (
                <Clock
                  size={48}
                  style={{
                    transform: `scale(${isHovered ? 1.1 : 1})`,
                    transition: "transform 0.2s ease",
                  }}
                />
              )}
              <span
                style={{
                  transform: `scale(${isHovered ? 1.05 : 1})`,
                  transition: "transform 0.2s ease",
                }}
              >
                {texts}
              </span>
            </>
          )}
        </div>
      </button>
      <audio ref={audioRef} src={attendanceSound} />
      {error && (
        <div style={{ color: "red", marginTop: "10px", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InkstallButton;
