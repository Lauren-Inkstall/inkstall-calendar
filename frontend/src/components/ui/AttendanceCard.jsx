import { CalendarCheck, Clock, MapPin } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "@mui/material";

export function AttendanceCard({
  date,
  dayOfWeek,
  status: backendStatus, // Fetching status from the backend
  checkIn,
  checkOut,
  workingHours,
}) {
  return (
    <Card
      className={cn(
        "w-full transition-all duration-300 hover:shadow-lg ",
        "border-l-4",
        backendStatus === "present"
          ? "border-l-emerald-500 bg-emerald-50/50"
          : backendStatus === "leave"
          ? "border-l-yellow-500 bg-yellow-50/50"
          : backendStatus === "auto-punched-out"
          ? "border-l-purple-500 bg-purple-50/50"
          : dayOfWeek === "Sunday"
          ? "border-l-blue-500 bg-blue-50/50"
          : backendStatus === "inprogress"
          ? "border-l-orange-500 bg-orange-50/50"
          : "border-l-red-500 bg-red-50/50",
        "animate-in fade-in-50 duration-500"
      )}
    >
      <div
        className={`p-6 ${
          backendStatus === "present"
            ? "bg-[#dcfce7]"
            : backendStatus === "leave"
            ? "bg-[#fef9c3]"
            : backendStatus === "auto-punched-out"
            ? "bg-[#c7b8ea]"
            : dayOfWeek === "Sunday"
            ? "bg-[#dbeafe]"
            : backendStatus === "inprogress"
            ? "bg-[#ffedd5]"
            : "bg-[#fee2e2]"
        }`}
      >
        <div className={`flex justify-between items-center mb-4`}>
          <div>
            <p className="text-sm text-muted-foreground">{dayOfWeek}</p>
            <h3 className="text-xs font-semibold">{date}</h3>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              backendStatus === "present"
                ? "border border-emerald-500 text-emerald-700"
                : backendStatus === "leave"
                ? "border border-yellow-500 text-yellow-700"
                : backendStatus === "auto-punched-out"
                ? "border border-purple-500 text-purple-700"
                : dayOfWeek === "Sunday"
                ? "border border-blue-500 text-blue-700"
                : backendStatus === "inprogress"
                ? "border border-orange-500 text-orange-700"
                : "border border-red-500 text-red-700"
            )}
          >
            {backendStatus === "present"
              ? "Present"
              : backendStatus === "leave"
              ? "On Leave"
              : backendStatus === "auto-punched-out"
              ? "Auto Punch-Out"
              : dayOfWeek === "Sunday"
              ? "Weekend"
              : backendStatus === "inprogress"
              ? "In Progress"
              : "Absent"}
          </span>
        </div>
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkIn && (
              <div className="space-y-2 bg-amber-50 p-4 rounded-2xl ">
                <h4 className="text-sm font-medium text-blue-500">Check In</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-500">{checkIn.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-pink-400" />
                  <span className="text-sm truncate" title={checkIn.location}>
                    {checkIn.location}
                  </span>
                </div>
              </div>
            )}
            {checkOut && (
              <div className="space-y-2 bg-amber-50 p-4 rounded-2xl ">
                <h4 className="text-sm font-medium text-yellow-400">Check Out</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-500">{checkOut.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-pink-400" />
                  <span className="text-sm truncate" title={checkOut.location}>
                    {checkOut.location}
                  </span>
                </div>
              </div>
            )}
          </div>
          {workingHours && (
            <div className="mt-4 pt-4 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Working Hours: {workingHours}</span>
            </div>
          )}
        </>
        {backendStatus === "leave" && (
          <div className="mt-4 pt-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-green-500">Leave Approved</span>
          </div>
        )}
        {dayOfWeek === "Sunday" && (
          <div className="mt-4 pt-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Weekend</span>
          </div>
        )}
      </div>
    </Card>
  );
}
