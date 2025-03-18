import React from 'react'
import { Box, Button, Card } from "@mui/material";
import MainFrame from './ui/MainFrame';
import ApplyForLeaveForm from './ui/ApplyForLeaveForm';
import Backdrop from '@mui/material/Backdrop';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
const AttendanceList = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "50vw",
    bgcolor: 'background.paper',
    boxShadow: 19,
    p: 1,
  };


  // const attendanceData = [
  //   {
  //     date: "22 Feb 2025",
  //     dayOfWeek: "Saturday",
  //     status: "absent",
  //   },
  //   {
  //     date: "21 Feb 2025",
  //     dayOfWeek: "Friday",
  //     status: "present",
  //     checkIn: {
  //       time: "12:58 PM",
  //       location: "Rustomjee Ozone Tower, 7, Mahesh Nagar, Goregaon West, Mumbai, Maharashtra 400104, India",
  //     },
  //     checkOut: {
  //       time: "10:00 PM",
  //       location: "Rustomjee Ozone Tower, 7, Mahesh Nagar, Goregaon West, Mumbai, Maharashtra 400104, India",
  //     },
  //     workingHours: "9h 1m",
  //   },
  //   {
  //     date: "28 Feb 2025",
  //     dayOfWeek: "Saturday",
  //     status: "leave",
  //   },
  //   {
  //     "date": "2025-02-23",
  //     "dayOfWeek": "Sunday",
  //     "status": "weekend",
  //   }

  // ];
  return (
    <MainFrame>
      <Card className="w-full mx-auto p-6 ">
        <Box className="w-full flex items-start justify-between">
          <h2 className="text-2xl font-semibold mb-6 text-primary">
            Recent Attendance (Last 30 Days)
          </h2>
          <Button onClick={handleOpen} sx={{backgroundColor:"#fecc00" , color:"#fff" , fontSize:"14px" }}>
            Apply for a Leave
          </Button>
        </Box>
        <div className="space-y-4">
          {/* {attendanceData.map((attendance, index) => (
            <AttendanceCard
              key={attendance.date}
              {...attendance}
            />
          ))} */}
        </div>
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
           <ApplyForLeaveForm/>
          </Box>
        </Fade>
      </Modal>
    </MainFrame>
  )
}

export default AttendanceList
