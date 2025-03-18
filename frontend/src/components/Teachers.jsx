//updated Teachers.jsx

import { useEffect, useState } from 'react';
import MainFrame from './ui/MainFrame';
import TeacherCard from './TeacherCard';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import api from "../api";

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const response = await api.get('/auth/teachers');
                console.log('Teacher API response:', response.data);
    
                // Access the teachers array from the response
                const formattedTeachers = response.data.teachers.map(teacher => {
                    // Create proper email mapping
                    // The backend sends "email" but TeacherCard expects "emailId"
                    return {
                        _id: teacher.id,
                        name: teacher.name,
                        emailId: teacher.email, // Map backend email to emailId for consistency
                        joining_date: teacher.startingDate,
                        salary: `${teacher.salary?.amount || 0}/month`,
                        timing: `09:00 AM - 05:00 PM`,
                        subjects: teacher.subjects || []
                    };
                });
    
                console.log('Formatted teachers:', formattedTeachers);
                setTeachers(formattedTeachers);
            } catch (err) {
                console.error('Error fetching teachers:', err);
                setError(err.response?.data?.message || 'Failed to fetch teachers');
            } finally {
                setLoading(false);
            }
        };
    
        fetchTeachers();
    }, []); 
    
    return (
        <MainFrame>
            <Typography variant="h4" component="h4" sx={{ mb: 4 }}>Teachers</Typography>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Box sx={{
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'flex-start',
                    width: '100%',
                    display: "flex"
                }}>
                    {teachers.map((teacher, index) => (
                        <TeacherCard key={index} teacher={teacher} />
                    ))}
                </Box>
            )}
        </MainFrame>
    );
};

export default Teachers;
