// useMyTeacherPoints.js
import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";

const useTeacherPoints = () => {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teacher-points");
      setPoints(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching teacher points:", err);
      setError("Failed to load points data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  // Play coin sound when points are awarded
  const playCoinSound = () => {
    try {
      // Ensure '/sounds/coin.mp3' exists in your public folder and is supported.
      const audio = new Audio("/sounds/coin.mp3");
      audio.play().catch((err) => console.error("Error playing sound:", err));
    } catch (err) {
      console.error("Error with audio playback:", err);
    }
  };

  // Show toast notification with points earned
  const showPointsToast = (pointsEarned, activity) => {
    if (pointsEarned === undefined || pointsEarned === null) {
      console.warn("showPointsToast called but 'pointsEarned' is undefined/null.");
      return;
    }
    toast.success(`🎉 You earned ${pointsEarned} points for ${activity}!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  return {
    points,
    loading,
    error,
    fetchPoints,
    playCoinSound,
    showPointsToast,
  };
};

export default useTeacherPoints;
