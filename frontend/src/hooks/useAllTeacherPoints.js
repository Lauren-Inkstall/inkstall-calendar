import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";

// Custom hook to fetch all teachers' points for the current month.
const useAllTeacherPoints = () => {
  // Use an empty array because we expect a list of teacher records.
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all teacher points from the backend (calls /teacher-points/all)
  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teacher-points/all");
      // Ensure the response is an array
      const data = Array.isArray(response.data) ? response.data : [response.data];
      setPoints(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching all teacher points:", err);
      setError(err.response?.data?.message || "Failed to load points data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  // Utility functions (optional, same as above)
  const playCoinSound = () => {
    try {
      const audio = new Audio("/sounds/coin.mp3");
      audio.play().catch((err) => console.error("Error playing sound:", err));
    } catch (err) {
      console.error("Error with audio playback:", err);
    }
  };

  const showPointsToast = (pointsEarned, activity) => {
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

export default useAllTeacherPoints;
