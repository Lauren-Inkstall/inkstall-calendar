import React, { createContext, useState, useEffect } from "react";
import api from "../api"; // Your Axios instance

export const InfoContext = createContext();

export const InfoProvider = ({ children }) => {
  const [info, setInfo] = useState({
    branches: [],
    boards: [],
    grades: [],
    teachers: [], // Added teachers array
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Fetch data from multiple endpoints in parallel
        const [branchesResponse, boardsResponse, gradesResponse, teachersResponse] = await Promise.all([
          api.get("/branches"),
          api.get("/boards"),
          api.get("/grades"),
          api.get("/teachers"), // Added teachers endpoint
        ]);

        // Update the info state with all fetched data
        setInfo({
          branches: branchesResponse.data,
          boards: boardsResponse.data,
          grades: gradesResponse.data[0].grades,
          teachers: teachersResponse.data, // Added teachers data
        });
      } catch (error) {
        console.error("Error fetching info:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, []);

  return (
    <InfoContext.Provider value={{ 
      info, 
      boards: info.boards, 
      grades: info.grades,
      branches: info.branches,
      teachers: info.teachers, // Added teachers to provider value
      loading, 
      error 
    }}>
      {children}
    </InfoContext.Provider>
  );
};