import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const TeacherSearch = ({ onSearch }) => {
  const handleChange = (event) => {
    if (onSearch) {
      onSearch(event.target.value);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        size="small"
        placeholder="Search teachers"
        fullWidth
        onChange={handleChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: '#757575' }} />
            </InputAdornment>
          ),
          sx: {
            fontSize: '0.85rem',
            borderRadius: '20px',
            backgroundColor: '#f5f5f5',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
              boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)',
            },
            pr: 1,
          },
        }}
      />
    </Box>
  );
};

TeacherSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default TeacherSearch;
    