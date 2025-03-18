import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../api';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
}));

const AdminTeacherPoints = () => {
  const [teacherPoints, setTeacherPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    const fetchAllTeacherPoints = async () => {
      try {
        setLoading(true);
        const response = await api.get('/teacher-points/all');
        setTeacherPoints(response.data);
        
        // Set current month from the first record if available
        if (response.data && response.data.length > 0) {
          setCurrentMonth(response.data[0].month);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching all teacher points:', err);
        setError('Failed to load teacher points data. You may not have admin privileges.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllTeacherPoints();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort teachers by total points (descending)
  const sortedTeachers = [...teacherPoints].sort((a, b) => b.totalPoints - a.totalPoints);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Teacher Activity Points Leaderboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Month: {currentMonth}
          </Typography>
          
          <Box mt={2} mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography>
              Total Teachers: <Chip label={teacherPoints.length} color="primary" size="small" />
            </Typography>
            
            {teacherPoints.length > 0 && (
              <Typography>
                Top Score: <Chip label={sortedTeachers[0]?.totalPoints || 0} color="success" size="small" />
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Rank</StyledTableCell>
              <StyledTableCell>Teacher Name</StyledTableCell>
              <StyledTableCell align="right">Daily Updates</StyledTableCell>
              <StyledTableCell align="right">K-Sheets</StyledTableCell>
              <StyledTableCell align="right">Test Submissions</StyledTableCell>
              <StyledTableCell align="right">Total Points</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTeachers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((teacher, index) => (
                <StyledTableRow key={teacher._id}>
                  <TableCell>
                    <Chip 
                      label={page * rowsPerPage + index + 1} 
                      color={index === 0 && page === 0 ? "success" : "default"}
                      variant={index === 0 && page === 0 ? "filled" : "outlined"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{teacher.teacherName}</TableCell>
                  <TableCell align="right">{teacher.dailyUpdatePoints}</TableCell>
                  <TableCell align="right">{teacher.kSheetPoints}</TableCell>
                  <TableCell align="right">{teacher.testPoints}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary">
                      {teacher.totalPoints}
                    </Typography>
                  </TableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={teacherPoints.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default AdminTeacherPoints;
