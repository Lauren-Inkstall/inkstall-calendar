import React, { useState, useEffect } from "react";
import MainFrame from "./ui/MainFrame";
import { FaCheck, FaTimes, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import { Download, FileText, ExternalLink, Filter } from "lucide-react";
import api from "../api";
import * as XLSX from "xlsx";
import { TiTick } from "react-icons/ti";
import TeacherAttendance from "./TeacherAttendance";
import { TablePagination } from "@mui/material";

// Helper to format date as DD/MM/YYYY
const formatDateDDMMYYYY = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to format time in 12-hour format (HH:MM AM/PM)
const formatTime = (date) => {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

const Admin = () => {
  const [filters, setFilters] = useState({
    studentName: "",
    teacherName: "",
    subject: "",
    date: "",
    branch: "",
    whatsappStatus: "",
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state for Daily Updates
  const [updatesPage, setUpdatesPage] = useState(0);
  const [updatesPageSize, setUpdatesPageSize] = useState(10);
  const [updatesPageSizeOptions, setUpdatesPageSizeOptions] = useState([]);

  // Pagination state for Leave Requests
  const [leavePage, setLeavePage] = useState(0);
  const [leavePageSize, setLeavePageSize] = useState(10);
  const [leavePageSizeOptions, setLeavePageSizeOptions] = useState([]);

  const handleUpdatesChangePage = (event, newPage) => {
    setUpdatesPage(newPage);
  };

  const handleUpdatesChangeRowsPerPage = (event) => {
    setUpdatesPageSize(parseInt(event.target.value, 10));
    setUpdatesPage(0);
  };

  const handleLeaveChangePage = (event, newPage) => {
    setLeavePage(newPage);
  };

  const handleLeaveChangeRowsPerPage = (event) => {
    setLeavePageSize(parseInt(event.target.value, 10));
    setLeavePage(0);
  };

  // Update page size options for Leave Requests
  useEffect(() => {
    const newPageSizeOptions = Array.from(
      { length: Math.ceil(leaveRequests.length / 10) },
      (_, i) => (i + 1) * 10
    );
    setLeavePageSizeOptions(newPageSizeOptions);

    if (!newPageSizeOptions.includes(leavePageSize)) {
      setLeavePageSize(newPageSizeOptions[newPageSizeOptions.length - 1] || 10);
    }

    const maxPage = Math.ceil(leaveRequests.length / leavePageSize);
    if (leavePage >= maxPage) {
      setLeavePage(maxPage > 0 ? maxPage - 1 : 0);
    }
  }, [leaveRequests.length, leavePageSize]);

  // Update page size options for Daily Updates
  useEffect(() => {
    const newPageSizeOptions = Array.from(
      { length: Math.ceil(filteredUpdates.length / 10) },
      (_, i) => (i + 1) * 10
    );
    setUpdatesPageSizeOptions(newPageSizeOptions);

    if (!newPageSizeOptions.includes(updatesPageSize)) {
      setUpdatesPageSize(
        newPageSizeOptions[newPageSizeOptions.length - 1] || 10
      );
    }

    const maxPage = Math.ceil(filteredUpdates.length / updatesPageSize);
    if (updatesPage >= maxPage) {
      setUpdatesPage(maxPage > 0 ? maxPage - 1 : 0);
    }
  }, [filteredUpdates.length, updatesPageSize]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchDailyUpdates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, dailyUpdates]);

  // Fetch all leave requests
  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get("/leave-requests/all");
      setLeaveRequests(response.data);
    } catch (error) {
      toast.error("Error fetching leave requests");
    }
  };

  // Fetch daily updates from /daily-updates/all, but keep multiple students in one row
  const fetchDailyUpdates = async () => {
    try {
      const response = await api.get("/daily-updates/all");
      const rawUpdates = response.data;
      const processedData = [];

      rawUpdates.forEach((update) => {
        const teacherName = update.teacherName || "Unknown Teacher";

        // For each subject–chapter, store the entire students array in one row
        update.subjects.forEach((subject) => {
          subject.chapters.forEach((chapter) => {
            processedData.push({
              dailyUpdateId: update._id, // actual document ID for PATCH
              compositeId: `${update._id}-${subject._id}-${chapter._id}`, // for React key
              message: update.message,
              date: update.date,
              teacherName,
              students: update.students, // keep the entire array of students
              subject: subject.name,
              chapterName: chapter.chapterName,
              progress: chapter.chapterCompletion,
              notes: chapter.notes,
              kSheetUrl: chapter.kSheetUrl || "",
              hasKSheet: chapter.kSheet === "yes",
              branch: update.branch || "",
            });
          });
        });
      });

      setDailyUpdates(processedData);
      setFilteredUpdates(processedData);
    } catch (error) {
      toast.error("Error fetching daily updates");
      console.error(error);
    }
  };

  // Update leave request status
  const handleStatusUpdate = async (id, status, leaveType) => {
    try {
      await api.patch(`/leave-requests/${id}/status`, { status, leaveType });
      if (status === "approved") {
        toast.success(
          `Leave ${
            leaveType === "paid" ? "(Paid)" : "(Unpaid)"
          } approved successfully`
        );
      } else {
        toast.info("Leave request rejected");
      }
      fetchLeaveRequests();
    } catch (error) {
      toast.error("Error updating leave request");
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters to the flattened daily updates
  const applyFilters = () => {
    let filtered = [...dailyUpdates];

    // Filter by student name (check if any student matches)
    if (filters.studentName) {
      filtered = filtered.filter((upd) =>
        upd.students.some((student) =>
          student.name.toLowerCase().includes(filters.studentName.toLowerCase())
        )
      );
    }

    if (filters.teacherName) {
      filtered = filtered.filter((upd) =>
        upd.teacherName
          .toLowerCase()
          .includes(filters.teacherName.toLowerCase())
      );
    }

    if (filters.subject) {
      filtered = filtered.filter((upd) =>
        upd.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter((upd) => {
        const updateDate = formatDateDDMMYYYY(upd.date);
        const filterDate = formatDateDDMMYYYY(filters.date);
        return updateDate === filterDate;
      });
    }

    if (filters.branch) {
      filtered = filtered.filter((upd) =>
        upd.branch.toLowerCase().includes(filters.branch.toLowerCase())
      );
    }

    if (filters.whatsappStatus) {
      if (filters.whatsappStatus.toLowerCase() === "sent") {
        filtered = filtered.filter((upd) => upd.message === true);
      } else if (filters.whatsappStatus.toLowerCase() === "not sent") {
        filtered = filtered.filter((upd) => !upd.message);
      }
    }

    setFilteredUpdates(filtered);
  };

  // Reset filter fields
  const resetFilters = () => {
    setFilters({
      studentName: "",
      teacherName: "",
      subject: "",
      date: "",
      branch: "",
      whatsappStatus: "",
    });
    setFilteredUpdates(dailyUpdates);
  };

  // Export to Excel (include all students in a single cell)
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredUpdates.map((upd) => ({
        Date: formatDateDDMMYYYY(upd.date),
        Teacher: upd.teacherName,
        Students: upd.students.map((s) => s.name).join(", "),
        Branch: upd.branch,
        Subject: upd.subject,
        Chapter: upd.chapterName,
        Progress: `${upd.progress}%`,
        Notes: upd.notes,
        "K-Sheet": upd.hasKSheet ? "Available" : "Not Available",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Updates");
    XLSX.writeFile(workbook, "Daily_Updates_Report.xlsx");
    toast.success("Report exported successfully");
  };

  // Mark daily update as "Sent" on WhatsApp by patching the document
  const handleWhatsAppStatusUpdate = async (id) => {
    try {
      const response = await api.patch(`/daily-updates/${id}`, {
        message: true,
      });
      if (response.status === 200 || response.status === 204) {
        toast.success("WhatsApp status updated successfully!");
      } else {
        toast.info("No changes made to the status.");
      }
      fetchDailyUpdates();
    } catch (error) {
      console.error("Error updating WhatsApp status:", error);
      toast.error("Failed to update WhatsApp status. Please try again.");
    }
  };

  // Build the WhatsApp message text following the requested format with emojis and branch information.
  const buildWhatsAppMessage = (update) => {
    const dateStr = formatDateDDMMYYYY(update.date);
    const timeStr = formatTime(update.date);
    const kSheetStatus = update.hasKSheet ? "Given" : "Not Given";

    // Build the students block. For each student, list details on separate lines.
    const studentsBlock = update.students
      .map(
        (s) =>
          `👨‍🎓 Student Name: ${s.name}\n📚 Grade: ${s.grade}\n🏫 Board: ${s.board}`
      )
      .join("\n\n");

    const message = `Daily Update Information

📅 Date: ${dateStr}

${studentsBlock}

📖 Subject: ${update.subject}
👨‍🏫 Teacher: ${update.teacherName}
🏢 Branch: ${update.branch}

Additional Information:
•⁠  ⁠Chapter: ${update.chapterName}
•⁠  ⁠Progress: ${update.progress}%
•⁠  ⁠K-Sheet: ${kSheetStatus}`;

    return encodeURIComponent(message);
  };

  return (
    <MainFrame>
      <div className="p-6 space-y-8">
        {/* Leave Requests Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Leave Requests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveRequests
                  .slice(
                    leavePage * leavePageSize,
                    leavePage * leavePageSize + leavePageSize
                  )
                  .map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.teacherName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDateDDMMYYYY(request.startDate)} -{" "}
                        {formatDateDDMMYYYY(request.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.reasonForLeave}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                          {request.status === "approved" &&
                            ` (${request.leaveType})`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === "pending" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  request._id,
                                  "approved",
                                  "paid"
                                )
                              }
                              className="text-green-600 hover:text-green-900"
                              title="Approve (Paid)"
                            >
                              <FaCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  request._id,
                                  "approved",
                                  "unpaid"
                                )
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Approve (Unpaid)"
                            >
                              <FaCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(request._id, "rejected")
                              }
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <FaTimes className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {leaveRequests.length > 0 && (
              <div className="py-3">
                <TablePagination
                  component="div"
                  count={leaveRequests.length}
                  page={leavePage}
                  onPageChange={handleLeaveChangePage}
                  rowsPerPage={leavePageSize}
                  onRowsPerPageChange={handleLeaveChangeRowsPerPage}
                  rowsPerPageOptions={leavePageSizeOptions}
                />
              </div>
            )}
          </div>
        </section>

        {/* Daily Updates Report Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-secondary">
              Daily Updates Report
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                onClick={exportToExcel}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export to Excel
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <input
                    type="text"
                    name="teacherName"
                    value={filters.teacherName}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Filter by teacher"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={filters.studentName}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Filter by student"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={filters.subject}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Filter by subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={filters.branch}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Filter by branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Status
                  </label>
                  <select
                    name="whatsappStatus"
                    value={filters.whatsappStatus}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All</option>
                    <option value="sent">Sent</option>
                    <option value="not sent">Not Sent</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={resetFilters} className="btn-outline">
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    K-Sheet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUpdates.length > 0 ? (
                  filteredUpdates
                    .slice()
                    .reverse()
                    .slice(
                      updatesPage * updatesPageSize,
                      updatesPage * updatesPageSize + updatesPageSize
                    )
                    .map((update) => (
                      <tr key={update.compositeId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateDDMMYYYY(update.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.teacherName}
                        </td>
                        {/* Render multiple students, each on its own line */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.students.map((student, idx) => (
                            <div key={idx}>
                              {student.name} ({student.grade}, {student.board})
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.chapterName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.progress}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {update.hasKSheet && update.kSheetUrl ? (
                            <a
                              href={update.kSheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:text-primary/80"
                            >
                              <FileText className="w-4 h-4" />
                              <span>View K-Sheet</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-500">No K-Sheet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {update.branch}
                        </td>
                        <td className="flex items-center gap-1.5 px-6 py-4 whitespace-nowrap text-sm">
                          {!update.message ? (
                            <>
                              <a
                                href={`whatsapp://send?text=${buildWhatsAppMessage(
                                  update
                                )}`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#128C7E] transition-colors"
                              >
                                <FaWhatsapp className="w-5 h-5 text-white" />
                              </a>
                              <TiTick
                                color="rgb(51, 102, 204)"
                                size={20}
                                className="cursor-pointer"
                                onClick={() =>
                                  handleWhatsAppStatusUpdate(
                                    update.dailyUpdateId
                                  )
                                }
                              />
                            </>
                          ) : (
                            <span className="text-green-600 font-semibold">
                              Sent!
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No daily updates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredUpdates.length > 0 && (
              <div className="py-3">
                <TablePagination
                  component="div"
                  count={filteredUpdates.length}
                  page={updatesPage}
                  onPageChange={handleUpdatesChangePage}
                  rowsPerPage={updatesPageSize}
                  onRowsPerPageChange={handleUpdatesChangeRowsPerPage}
                  rowsPerPageOptions={updatesPageSizeOptions}
                />
              </div>
            )}
          </div>
        </section>
      </div>
      <TeacherAttendance />
    </MainFrame>
  );
};

export default Admin;
