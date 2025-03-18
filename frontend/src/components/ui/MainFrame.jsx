import React from "react";
import { Container } from '@mui/material';
import { motion } from 'framer-motion';

const MainFrame = ({ children }) => {
  return (
    <Container 
      maxWidth="xl"
      sx={{
        Height: '100vh',
        display: 'flex',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%' , backgroundColor:"#fff" , marginTop:"1rem" , padding:"1rem" , borderRadius:"8px" , height:"85vh" , overflowY:"scroll" }}
      >
        {children}
      </motion.div>
    </Container>
  );
};

export default MainFrame;
