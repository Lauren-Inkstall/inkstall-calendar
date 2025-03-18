import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./components/Admin";
import DailyUpdates from "./components/DailyUpdates";
import Layout from "./components/layout/Layout";
import Login from "./components/Login";
import MyAttendance from "./components/MyAttendance";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Teachers from "./components/Teachers";
import Settings from "./components/Settings";
import StudentForm from "./components/Students";
import TodaysAttendance from "./components/TodaysAttendance";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MyPoints from "./components/TeacherPoints";
import TestSubmission from "./components/TestSubmission";
import StudentsDatabase from "./components/StudentsDatabase";
import StudentPerformance from "./components/StudentPerformance";
import { StudentsProvider } from "./context/StudentContext";
import { SubjectsProvider } from "./context/SubjectsContext";
// import { GradesProvider } from "./context/GradesContext";
import { InfoProvider } from "./context/InfoContext";
import { NotificationProvider } from "./context/NotificationContext";
import MainCalendar from "./components/MainCalendar";


const App = () => {
  return (
    <BrowserRouter>
      {/* ToastContainer must be rendered to show toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped with multiple context providers */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <StudentsProvider>
                <SubjectsProvider>
                  {/* <GradesProvider> */}
                  <InfoProvider>
                    <NotificationProvider>
                    <Layout />
                    </NotificationProvider>
                  </InfoProvider>
                  {/* </GradesProvider> */}
                </SubjectsProvider>
              </StudentsProvider>
            }
          >
            <Route index element={<TodaysAttendance />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/daily-updates" element={<DailyUpdates />} />
            <Route path="/test-submission" element={<TestSubmission />} />
            <Route path="/student-performance" element={<StudentPerformance />} />
            <Route path="/students" element={<StudentForm />} />
            <Route path="/students-database" element={<StudentsDatabase />} />
            <Route path="/teacher-points" element={<MyPoints />} />
            <Route path="/calendar" element={<MainCalendar />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
