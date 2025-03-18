import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import TeacherAttendanceCalendar from './TeacherAttendanceCalendar';

const TeacherAttendanceCard = ({ 
  teacherId, 
  teacherName, 
  presentDays = 0, 
  leaveDays = 0, 
  absentDays = 0,
  averageHours = "0.0"   
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  
  const openCalendar = () => setShowCalendar(true);
  const closeCalendar = () => setShowCalendar(false);
  
  return (
    <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white w-full">
      <div className="mb-3">
        <h3 className="font-medium text-amber-500">{teacherName}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-y-1">
        <div>Present Days:</div>
        <div className="text-right text-blue-600">{presentDays}</div>
        
        <div>Leave Days:</div>
        <div className="text-right text-amber-500">{leaveDays}</div>
        
        <div>Absent Days:</div>
        <div className="text-right text-red-500">{absentDays}</div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-y-1">
        <div>Average Hours:</div>
        <div className="text-right text-blue-600">{averageHours}</div>
      </div>
      
      <div className="mt-2 text-right">
        <button 
          onClick={openCalendar}
          className="text-amber-500"
          title="View Calendar"
          type="button"
        >
          <Calendar size={18} />
        </button>
      </div>
      
      {showCalendar && (
        <TeacherAttendanceCalendar 
          teacherId={teacherId}
          teacherName={teacherName}
          onClose={closeCalendar}
        />
      )}
    </div>
  );
};

export default TeacherAttendanceCard;