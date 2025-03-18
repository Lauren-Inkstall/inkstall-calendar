import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Box, Button, Grid, TextField, Typography, Card, CardContent, Snackbar, Alert, useTheme, useMediaQuery } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; // Assuming you have an api instance

const validationSchema = yup.object().shape({
  teacherName: yup.string().required('Teacher name is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required'),
  reasonForLeave: yup.string().required('Reason for leave is required'),
});

const formFields = [
  { name: 'teacherName', label: 'Teacher Name', type: 'text', readOnly: true },
  { name: 'startDate', label: 'Start Date', type: 'date' },
  { name: 'endDate', label: 'End Date', type: 'date' },
  { name: 'reasonForLeave', label: 'Reason for Leave', type: 'textarea' },
];

const ApplyForLeaveForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const userName = localStorage.getItem('userName') || '';
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      teacherName: userName,
      startDate: null,
      endDate: null,
      reasonForLeave: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        teacherName: data.teacherName,
        startDate: data.startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        endDate: data.endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        reasonForLeave: data.reasonForLeave
      };

      const response = await api.post('/leave-requests/submit', formattedData);
      
      setSnackbar({
        open: true,
        message: 'Leave request submitted successfully!',
        severity: 'success'
      });

      // Reset form after successful submission
      reset({
        teacherName: userName,
        startDate: null,
        endDate: null,
        reasonForLeave: ''
      });
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to submit leave request. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <CardContent sx={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <Typography variant="h5" className="flex items-center mb-4 text-blue-900 font-bold">
        <CalendarTodayIcon className="mr-2 text-yellow-500" /> Apply for Leave
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {formFields.map((field) => (
            <Grid key={field.name} item xs={12} sm={field.type === 'textarea' ? 12 : 6}>
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  field.type === 'date' ? (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={field.label}
                        {...controllerField}
                        slotProps={{
                          textField: {
                            size: isMobile ? "small" : "medium",
                            fullWidth: true,
                            required: true,
                            error: !!errors[field.name],
                            helperText: errors[field.name]?.message
                          }
                        }}
                      />
                    </LocalizationProvider>
                  ) : (
                    <TextField
                      {...controllerField}
                      label={field.label}
                      variant="outlined"
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      multiline={field.type === 'textarea'}
                      minRows={field.type === 'textarea' ? 3 : undefined}
                      InputProps={{ readOnly: field.readOnly }}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]?.message}
                    />
                  )
                )}
              />
            </Grid>
          ))}
        </Grid>
        <Box className="flex justify-end mt-4">
          <Button type="submit" variant="contained" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            Submit Leave Request
          </Button>
        </Box>
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </CardContent>
  );
};

export default ApplyForLeaveForm;