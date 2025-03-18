import React from 'react'
import MainFrame from './ui/MainFrame'
import { Box, Typography } from '@mui/material'
import notfound from '../assets/Images/404Image.avif'
import { useNavigate } from 'react-router-dom'
import InkstallButton from './ui/InkstallButton'

const NotFound = () => {


  return (
    <MainFrame>
        <Box sx={{display:"flex" , flexDirection:"column" , justifyContent:"center", alignItems:"center", width:"100%" }}>
            <img src={notfound} alt="404" />
            <Typography variant="h4" component="h4" sx={{ mb: 4, color: '#1a237e', fontWeight: 600 }}>Oops! Page Not Found</Typography>
            <InkstallButton link={"/"} texts={["Go to Homepage"]} h={"3.5em"} w={"10em"} btnColor={"#fecc00"} />
            {/* <button onClick={goToHomepage}>Go to Homepage</button> */}
        </Box>
    </MainFrame>
  )
}

export default NotFound