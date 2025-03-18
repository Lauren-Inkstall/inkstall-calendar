import React, { createContext, useState, useEffect } from "react";
import api from "../api"; // Your Axios instance

export const SubjectsContext = createContext();

export const SubjectsProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get("/subjects");
        // Assuming the response data is an array of subject objects with a "name" property
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <SubjectsContext.Provider value={{ subjects, loading }}>
      {children}
    </SubjectsContext.Provider>
  );
};
