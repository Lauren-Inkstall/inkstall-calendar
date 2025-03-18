import React, { useContext } from 'react';
import { Container, Typography, Grid, Box, Paper } from '@mui/material';
import TeacherPoints from '../components/TeacherPoints';
import AdminTeacherPoints from '../components/AdminTeacherPoints';
import { AuthContext } from '../context/AuthContext';

const TeacherPointsPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Activity Points Dashboard
      </Typography>
      
      <Grid container spacing={4}>
        {/* Teacher's personal points card */}
        <Grid item xs={12} md={isAdmin ? 4 : 12}>
          <TeacherPoints />
        </Grid>
        
        {/* Admin view of all teachers' points */}
        {isAdmin && (
          <Grid item xs={12} md={8}>
            <AdminTeacherPoints />
          </Grid>
        )}
        
        {/* Points information section */}
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              backgroundColor: 'rgba(63, 81, 181, 0.05)'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              How to Earn Activity Points
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Daily Updates
              </Typography>
              <Typography variant="body2">
                Submit your daily teaching updates to earn 30 points per update.
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                K-Sheets
              </Typography>
              <Typography variant="body2">
                Submit K-Sheets with your daily updates to earn 100 points per K-Sheet.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Test Submissions
              </Typography>
              <Typography variant="body2">
                Submit test results to earn points based on student performance:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2">
                    For marks up to 80%: Points increase progressively, up to 400 points
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    For marks above 80%: Bonus points awarded, up to a maximum of 500 points
                  </Typography>
                </li>
              </ul>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" fontStyle="italic">
                Note: Points are tracked monthly. A new points cycle begins at the start of each month.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherPointsPage;
