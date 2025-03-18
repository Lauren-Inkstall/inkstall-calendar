import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import MainFrame from "./ui/MainFrame";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  Autocomplete,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import api from "../api";
import { StudentsContext } from "../context/StudentContext";
import { BsUpload } from "react-icons/bs";

const StudentPerformance = () => {
  // State for selected student
  const [selectedStudent, setSelectedStudent] = useState(null);

  // State for selected subject filter
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("");

  // States for new performance entry
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("Inkstall Test");
  const [marks, setMarks] = useState("0");
  const [totalMarks, setTotalMarks] = useState("100");

  const [selectedFile, setSelectedFile] = useState(null);

  // State to hold fetched performance history
  const [performanceHistory, setPerformanceHistory] = useState([]);

  // States for chart data
  const [schoolTestChartData, setSchoolTestChartData] = useState([]);
  const [inkstallTestChartData, setInkstallTestChartData] = useState([]);
  const [subjectColors, setSubjectColors] = useState({});
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Sample test types
  const testTypes = ["Inkstall Test", "School Test"];

  // Use context for students
  const { students, loading: studentsLoading } = useContext(StudentsContext);

  // Handle student selection and fetch performance history
  const handleStudentChange = (event, newValue) => {
    setSelectedStudent(newValue);
    setSubject("");
    setSelectedSubjectFilter("");
  };

  // Handle subject filter change
  const handleSubjectFilterChange = (event) => {
    setSelectedSubjectFilter(event.target.value);
  };

  // Fetch performance history when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      fetchPerformanceHistory(selectedStudent.studentId);
    } else {
      setPerformanceHistory([]);
      setSchoolTestChartData([]);
      setInkstallTestChartData([]);
      setSubjectColors({});
      setAvailableSubjects([]);
    }
  }, [selectedStudent, selectedSubjectFilter]);

  const fetchPerformanceHistory = async (studentId) => {
    try {
      const res = await api.get(`/student-performance/${studentId}`);
      if (res.data.success) {
        setPerformanceHistory(res.data.data);
        prepareChartData(res.data.data);
      } else {
        setPerformanceHistory([]);
        setSchoolTestChartData([]);
        setInkstallTestChartData([]);
        setSubjectColors({});
        setAvailableSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching performance history", error);
      setPerformanceHistory([]);
      setSchoolTestChartData([]);
      setInkstallTestChartData([]);
      setSubjectColors({});
      setAvailableSubjects([]);
    }
  };

  // Process performance data for charts
  const prepareChartData = (performanceData) => {
    if (!performanceData || performanceData.length === 0) {
      setSchoolTestChartData([]);
      setInkstallTestChartData([]);
      setSubjectColors({});
      setAvailableSubjects([]);
      return;
    }

    // Sort data by date
    const sortedData = [...performanceData].sort(
      (a, b) => new Date(a.submitDateTime) - new Date(b.submitDateTime)
    );

    // Collect all subjects and generate colors
    const subjects = new Set();
    sortedData.forEach((entry) => {
      subjects.add(entry.subject);
    });

    // Set available subjects for dropdown
    setAvailableSubjects(Array.from(subjects));

    // Generate colors for subjects
    const newSubjectColors = {};
    Array.from(subjects).forEach((subject, index) => {
      const hue = (index * 137) % 360; // Use golden ratio to spread colors
      newSubjectColors[subject] = `hsl(${hue}, 70%, 60%)`;
    });
    setSubjectColors(newSubjectColors);

    // Filter data by selected subject if needed
    let filteredData = sortedData;
    if (selectedSubjectFilter !== "") {
      filteredData = sortedData.filter(
        (entry) => entry.subject === selectedSubjectFilter
      );
    }

    // Prepare data for school tests
    prepareTestTypeChartData(
      filteredData,
      "School Test",
      setSchoolTestChartData
    );

    // Prepare data for inkstall tests
    prepareTestTypeChartData(
      filteredData,
      "Inkstall Test",
      setInkstallTestChartData
    );
  };

  // Process data for test type chart
  const prepareTestTypeChartData = (
    sortedData,
    testTypeFilter,
    setChartData
  ) => {
    // Filter data by test type
    const filteredData = sortedData.filter(
      (entry) => entry.testType === testTypeFilter
    );

    if (filteredData.length === 0) {
      setChartData([]);
      return;
    }

    // Create chart data with individual test entries
    const chartData = [];

    // Process each test entry individually
    filteredData.forEach((entry) => {
      const percentage = (entry.marks / entry.totalMarks) * 100;
      const testDate = new Date(entry.submitDateTime);

      // Create a data point for this test
      const dataPoint = {
        date: testDate.toLocaleDateString(),
        rawDate: testDate,
        testId: entry._id || `${entry.subject}-${entry.submitDateTime}`,
        description: entry.description || `${entry.subject} Test`,
        marks: entry.marks,
        totalMarks: entry.totalMarks,
      };

      // Add the subject's percentage to this data point
      dataPoint[entry.subject] = parseFloat(percentage.toFixed(1));

      chartData.push(dataPoint);
    });

    // Sort all data points by date
    chartData.sort((a, b) => a.rawDate - b.rawDate);

    // Add test index for each subject
    const subjectTestIndices = {};
    chartData.forEach((point) => {
      // Find which subject this test belongs to
      const subject = Object.keys(point).find(
        (key) =>
          key !== "date" &&
          key !== "rawDate" &&
          key !== "testId" &&
          key !== "description" &&
          key !== "marks" &&
          key !== "totalMarks"
      );

      if (subject) {
        // Initialize counter for this subject if needed
        if (!subjectTestIndices[subject]) {
          subjectTestIndices[subject] = 1;
        }

        // Add test index for this subject
        point.testIndex = subjectTestIndices[subject];

        // Increment counter for next test of this subject
        subjectTestIndices[subject]++;
      }
    });

    // Ensure we have at least two data points for each subject
    // If only one data point exists, duplicate it with a slight offset
    const subjects = new Set();
    chartData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (
          key !== "date" &&
          key !== "rawDate" &&
          key !== "testId" &&
          key !== "description" &&
          key !== "marks" &&
          key !== "totalMarks" &&
          key !== "testIndex"
        ) {
          subjects.add(key);
        }
      });
    });

    // Count data points for each subject
    const subjectCounts = {};
    subjects.forEach((subject) => {
      subjectCounts[subject] = chartData.filter(
        (point) => point[subject] !== undefined
      ).length;
    });

    // If any subject has only one data point, duplicate it
    if (chartData.length > 0) {
      subjects.forEach((subject) => {
        if (subjectCounts[subject] === 1) {
          // Find the point with this subject
          const pointWithSubject = chartData.find(
            (point) => point[subject] !== undefined
          );
          if (pointWithSubject) {
            // Create a duplicate point with a date 1 day later
            const originalDate = new Date(pointWithSubject.rawDate);
            const newDate = new Date(originalDate);
            newDate.setDate(newDate.getDate() + 1);

            // Create a new data point
            const newPoint = {
              date: newDate.toLocaleDateString(),
              rawDate: newDate,
              testId: `${pointWithSubject.testId}-duplicate`,
              description: `${pointWithSubject.description} (continued)`,
              marks: pointWithSubject.marks,
              totalMarks: pointWithSubject.totalMarks,
              testIndex: pointWithSubject.testIndex + 0.1, // Slightly offset index
            };

            // Add the subject value to the new point
            newPoint[subject] = pointWithSubject[subject];

            // Add to chart data
            chartData.push(newPoint);

            // Re-sort the data
            chartData.sort((a, b) => a.rawDate - b.rawDate);
          }
        }
      });
    }

    setChartData(chartData);
  };

  // Calculate progress for a specific subject
  const calculateSubjectProgress = (subject) => {
    if (!performanceHistory.length || subject === "") return null;

    const subjectEntries = performanceHistory.filter(
      (entry) => entry.subject === subject
    );
    if (subjectEntries.length < 2) return null; // Need at least 2 entries to calculate progress

    // Sort by date
    const sortedEntries = [...subjectEntries].sort(
      (a, b) => new Date(a.submitDateTime) - new Date(b.submitDateTime)
    );

    // Get first and last entry
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];

    // Calculate percentages
    const firstPercentage = (firstEntry.marks / firstEntry.totalMarks) * 100;
    const lastPercentage = (lastEntry.marks / lastEntry.totalMarks) * 100;

    // Calculate progress
    const progressDiff = lastPercentage - firstPercentage;

    return {
      subject,
      firstScore: firstPercentage.toFixed(1),
      lastScore: lastPercentage.toFixed(1),
      progressDiff: progressDiff.toFixed(1),
      improved: progressDiff >= 0,
      firstDate: new Date(firstEntry.submitDateTime).toLocaleDateString(),
      lastDate: new Date(lastEntry.submitDateTime).toLocaleDateString(),
    };
  };

  // Simple custom line chart component
  const SimpleLineChart = ({
    data,
    colors,
    height = 300,
    width = "100%",
    title,
  }) => {
    if (!data || data.length === 0) return null;

    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    useEffect(() => {
      if (!data || data.length === 0 || !svgRef.current) return;

      const svg = svgRef.current;
      const tooltip = tooltipRef.current;

      // Clear previous content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      // Get all keys except 'date'
      const metrics = Object.keys(data[0]).filter((key) => key !== "date");

      // If no metrics to display, return
      if (metrics.length === 0) return;

      // Set up dimensions
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const width = svg.clientWidth;
      const chartHeight = height - margin.top - margin.bottom;
      const chartWidth = width - margin.left - margin.right;

      // Find min and max values for y-axis
      let minValue = 0; // Start from 0 for percentage
      let maxValue = 100; // Max percentage is 100

      // Parse dates and find min/max dates
      const dates = data.map((d) => new Date(d.rawDate));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      // Add some padding to the date range
      const dateRange = maxDate - minDate;
      const paddedMinDate = new Date(minDate - dateRange * 0.05);
      const paddedMaxDate = new Date(maxDate.getTime() + dateRange * 0.05);

      // Set up scales
      const xScale = (date) => {
        return (
          margin.left +
          (chartWidth * (new Date(date) - paddedMinDate)) /
            (paddedMaxDate - paddedMinDate)
        );
      };

      const yScale = (value) => {
        return (
          height -
          margin.bottom -
          (chartHeight * (value - minValue)) / (maxValue - minValue)
        );
      };

      // Draw axes
      // X-axis
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // X-axis line
      const xAxisLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      xAxisLine.setAttribute("x1", margin.left);
      xAxisLine.setAttribute("y1", height - margin.bottom);
      xAxisLine.setAttribute("x2", width - margin.right);
      xAxisLine.setAttribute("y2", height - margin.bottom);
      xAxisLine.setAttribute("stroke", "#ccc");
      xAxisLine.setAttribute("stroke-width", "1");
      xAxis.appendChild(xAxisLine);

      // X-axis ticks and labels
      const xTickCount = Math.min(data.length, 5); // Limit to 5 ticks
      const xTickInterval = (paddedMaxDate - paddedMinDate) / (xTickCount - 1);

      for (let i = 0; i < xTickCount; i++) {
        const tickDate = new Date(paddedMinDate.getTime() + i * xTickInterval);
        const x = xScale(tickDate);

        // Tick line
        const tick = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        tick.setAttribute("x1", x);
        tick.setAttribute("y1", height - margin.bottom);
        tick.setAttribute("x2", x);
        tick.setAttribute("y2", height - margin.bottom + 5);
        tick.setAttribute("stroke", "#ccc");
        tick.setAttribute("stroke-width", "1");
        xAxis.appendChild(tick);

        // Tick label
        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        label.setAttribute("x", x);
        label.setAttribute("y", height - margin.bottom + 15);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10px");
        label.setAttribute("fill", "#666");
        label.textContent = tickDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        xAxis.appendChild(label);
      }

      svg.appendChild(xAxis);

      // Y-axis
      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "g");

      // Y-axis line
      const yAxisLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      yAxisLine.setAttribute("x1", margin.left);
      yAxisLine.setAttribute("y1", margin.top);
      yAxisLine.setAttribute("x2", margin.left);
      yAxisLine.setAttribute("y2", height - margin.bottom);
      yAxisLine.setAttribute("stroke", "#ccc");
      yAxisLine.setAttribute("stroke-width", "1");
      yAxis.appendChild(yAxisLine);

      // Y-axis ticks and labels
      const yTickValues = [0, 25, 50, 75, 100]; // Fixed ticks for percentage

      yTickValues.forEach((value) => {
        const y = yScale(value);

        // Tick line
        const tick = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        tick.setAttribute("x1", margin.left - 5);
        tick.setAttribute("y1", y);
        tick.setAttribute("x2", margin.left);
        tick.setAttribute("y2", y);
        tick.setAttribute("stroke", "#ccc");
        tick.setAttribute("stroke-width", "1");
        yAxis.appendChild(tick);

        // Grid line
        const gridLine = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        gridLine.setAttribute("x1", margin.left);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("x2", width - margin.right);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#eee");
        gridLine.setAttribute("stroke-width", "1");
        yAxis.appendChild(gridLine);

        // Tick label
        const label = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        label.setAttribute("x", margin.left - 10);
        label.setAttribute("y", y + 3);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "10px");
        label.setAttribute("fill", "#666");
        label.textContent = `${value}%`;
        yAxis.appendChild(label);
      });

      svg.appendChild(yAxis);

      // Y-axis label
      const yAxisLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      yAxisLabel.setAttribute(
        "transform",
        `rotate(-90, ${margin.left - 30}, ${height / 2})`
      );
      yAxisLabel.setAttribute("x", margin.left - 30);
      yAxisLabel.setAttribute("y", height / 2);
      yAxisLabel.setAttribute("text-anchor", "middle");
      yAxisLabel.setAttribute("font-size", "10px");
      yAxisLabel.setAttribute("fill", "#666");
      yAxisLabel.textContent = "Score (%)";
      svg.appendChild(yAxisLabel);

      // X-axis label
      const xAxisLabel = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      xAxisLabel.setAttribute("x", width / 2);
      xAxisLabel.setAttribute("y", height - 5);
      xAxisLabel.setAttribute("text-anchor", "middle");
      xAxisLabel.setAttribute("font-size", "10px");
      xAxisLabel.setAttribute("fill", "#666");
      xAxisLabel.textContent = "Date";
      svg.appendChild(xAxisLabel);

      // Chart title
      const chartTitle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      chartTitle.setAttribute("x", width / 2);
      chartTitle.setAttribute("y", margin.top / 2);
      chartTitle.setAttribute("text-anchor", "middle");
      chartTitle.setAttribute("font-size", "12px");
      chartTitle.setAttribute("font-weight", "bold");
      chartTitle.setAttribute("fill", "#333");
      chartTitle.textContent = title || "";
      svg.appendChild(chartTitle);

      // Draw lines for each metric
      metrics.forEach((metric) => {
        if (!colors[metric]) return; // Skip if no color defined

        // Collect points for this metric
        const points = [];
        data.forEach((d) => {
          if (d[metric] !== undefined) {
            const x = xScale(d.rawDate);
            const y = yScale(d[metric]);
            points.push({
              x,
              y,
              value: d[metric],
              date: d.date,
              metric,
              testIndex: d.testIndex || "",
              description: d.description || "",
            });
          }
        });

        if (points.length < 1) return; // Need at least 1 point

        // Draw line if we have at least 2 points
        if (points.length >= 2) {
          // Create path element
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );

          // Generate path data
          let pathData = `M ${points[0].x},${points[0].y}`;
          for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x},${points[i].y}`;
          }

          path.setAttribute("d", pathData);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", colors[metric]);
          path.setAttribute("stroke-width", "2");
          path.setAttribute("stroke-linejoin", "round");
          path.setAttribute("stroke-linecap", "round");
          svg.appendChild(path);
        }

        // Draw points
        points.forEach((point) => {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circle.setAttribute("cx", point.x);
          circle.setAttribute("cy", point.y);
          circle.setAttribute("r", "4");
          circle.setAttribute("fill", colors[metric]);
          circle.setAttribute("stroke", "white");
          circle.setAttribute("stroke-width", "1");

          // Add data attributes for tooltip
          circle.setAttribute("data-value", point.value);
          circle.setAttribute("data-date", point.date);
          circle.setAttribute("data-metric", point.metric);
          circle.setAttribute("data-test-index", point.testIndex);
          circle.setAttribute("data-description", point.description);

          // Add event listeners for hover
          circle.addEventListener("mouseenter", (e) => {
            // Highlight the point
            e.target.setAttribute("r", "6");

            // Update tooltip content and position
            if (tooltip) {
              const value = e.target.getAttribute("data-value");
              const date = e.target.getAttribute("data-date");
              const metricName = e.target.getAttribute("data-metric");
              const testIndex = e.target.getAttribute("data-test-index");
              const description = e.target.getAttribute("data-description");

              tooltip.innerHTML = `
                <div style="font-weight: bold;">${metricName}</div>
                <div>${description}</div>
                ${testIndex ? `<div>Test #${Math.floor(testIndex)}</div>` : ""}
                <div>${date}</div>
                <div>${value}%</div>
              `;

              const rect = svg.getBoundingClientRect();
              const x = parseFloat(e.target.getAttribute("cx"));
              const y = parseFloat(e.target.getAttribute("cy"));

              tooltip.style.display = "block";
              tooltip.style.left = `${
                x + rect.left - tooltip.offsetWidth / 2
              }px`;
              tooltip.style.top = `${
                y + rect.top - tooltip.offsetHeight - 10
              }px`;

              setHoveredPoint({ x, y, value, date, metric: metricName });
            }
          });

          circle.addEventListener("mouseleave", (e) => {
            // Reset point size
            e.target.setAttribute("r", "4");

            // Hide tooltip
            if (tooltip) {
              tooltip.style.display = "none";
              setHoveredPoint(null);
            }
          });

          svg.appendChild(circle);
        });
      });
    }, [data, colors, height, title]);

    return (
      <div style={{ position: "relative", width: width, height: height }}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          style={{ overflow: "visible" }}
        />
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            display: "none",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 1000,
            transform: "translate(-50%, -100%)",
          }}
        />
      </div>
    );
  };

  // Handle form submission to create a new performance record
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (testType === "Inkstall Test" && !selectedFile) {
      alert("Please upload a test file. It is required for Inkstall Test.");
      return;
    }
    const payload = {
      studentId: selectedStudent.studentId,
      subject,
      description,
      testType,
      marks,
      totalMarks,
      submitDateTime: new Date().toISOString(),
    };
    try {
      const res = await api.post("/student-performance", payload);
      if (res.data.success) {
        // If a file has been selected, upload it
        if (selectedFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", selectedFile);
          uploadFormData.append("performanceId", res.data.data._id);
          uploadFormData.append("studentId", selectedStudent.studentId);
          uploadFormData.append("subject", subject);
          uploadFormData.append("fileType", "performance-sheet");

          // Upload file to server
          try {
            const uploadResponse = await api.post(
              "/student-performance/upload-file",
              uploadFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            console.log("Performance file uploaded successfully:", uploadResponse.data);
          } catch (uploadError) {
            console.error("Error uploading performance file:", uploadError);
          }
        }
        
        // Refresh performance history after submission
        fetchPerformanceHistory(selectedStudent.studentId);
      }
    } catch (error) {
      console.error("Error saving performance", error);
    }
    // Reset form fields after submission
    setSubject("");
    setDescription("");
    setTestType("Inkstall Test");
    setMarks("0");
    setTotalMarks("100");
    setSelectedFile(null);
  };

    // Handle file selection
    const handleFileSelect = (event) => {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        // Validate file size (e.g., maximum 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert("File is too large. Maximum size is 10MB.");
          setSelectedFile(null);
          return;
        }
        setSelectedFile(file);
      }
    };

  if (studentsLoading) return <div>Loading students...</div>;

  return (
    <MainFrame>
      <Box sx={{ 
         p: { 
          xs: 0,    // Small padding on extra-small screens (mobile)
          sm: 2,    // Medium padding on small screens (tablets)
          md: 3     // Larger padding on medium and larger screens (desktop)
        } 
      }}>
        <h2 className="text-2xl font-bold mb-6">Students Performance</h2>

        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Student Selection */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body1" component="label">
                Select Student
              </Typography>
              <Autocomplete
                options={students}
                // Use studentName if available; fallback to name
                getOptionLabel={(option) =>
                  option.studentName || option.name || ""
                }
                value={selectedStudent}
                onChange={handleStudentChange}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select a student" />
                )}
              />
            </Box>

            {selectedStudent && (
              <>
                {/* Add Performance Entry Section */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                    Add Performance Entry
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" component="label">
                          Subject
                        </Typography>
                        <Select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          displayEmpty
                          disabled={!selectedStudent}
                        >
                          <MenuItem value="" disabled>
                            Select a subject
                          </MenuItem>
                          {selectedStudent?.subjects?.map((subj) => (
                            <MenuItem key={subj.name} value={subj.name}>
                              {subj.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>

                      <Box sx={{ display: "flex", gap: 3 }}>
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" component="label">
                            Description
                          </Typography>
                          <TextField
                            placeholder="e.g., Quiz 1"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" component="label">
                            Test Type
                          </Typography>
                          <Select
                            value={testType}
                            onChange={(e) => setTestType(e.target.value)}
                            fullWidth
                            size="small"
                          >
                            {testTypes.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", gap: 3 }}>
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" component="label">
                            Marks
                          </Typography>
                          <TextField
                            type="number"
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0 }}
                          />
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Typography variant="body2" component="label">
                            Total Marks
                          </Typography>
                          <TextField
                            type="number"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(e.target.value)}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1 }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography variant="body1" component="label">
                          Upload Test File {testType === 'Inkstall Test' && <span style={{ color: "red" }}>*</span>}
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<BsUpload />}
                          sx={{
                            width: "fit-content",
                            borderColor: "#e0e0e0",
                            color: "#333",
                            textTransform: "none",
                            "&:hover": { borderColor: "#4285F4" },
                          }}
                        >
                          {selectedFile ? "Change File" : "Upload File"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                            required={testType === 'Inkstall Test'}
                          />
                        </Button>
                        {selectedFile && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            File selected: {selectedFile.name}
                          </Typography>
                        )}
                        {!selectedFile && testType === 'Inkstall Test' && (
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: "red" }}>
                            File upload is required for Inkstall Test
                          </Typography>
                        )}
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                          bgcolor: "#1976D2",
                          color: "white",
                          py: 1.5,
                          "&:hover": { bgcolor: "#115293" },
                        }}
                      >
                        Submit Performance
                      </Button>
                    </Box>
                  </form>
                </Paper>

                {/* Performance Graphs Section */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                    Performance Trends
                  </Typography>

                  {/* Subject Filter */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      component="label"
                      sx={{ mb: 1, display: "block" }}
                    >
                      Filter by Subject
                    </Typography>
                    <Select
                      value={selectedSubjectFilter}
                      onChange={handleSubjectFilterChange}
                      size="small"
                      sx={{ minWidth: 200 }}
                    >
                      {availableSubjects.map((subject) => (
                        <MenuItem key={subject} value={subject}>
                          {subject}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {/* Subject Progress Summary */}
                  <Box sx={{ mb: 3 }}>
                    {(() => {
                      const progress = calculateSubjectProgress(
                        selectedSubjectFilter
                      );
                      if (!progress) return null;

                      return (
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Progress Summary for {selectedSubjectFilter}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                First Test ({progress.firstDate})
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {progress.firstScore}%
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                color: progress.improved
                                  ? "success.main"
                                  : "error.main",
                              }}
                            >
                              <Typography variant="body2" fontWeight="bold">
                                {progress.improved ? "↗" : "↘"}{" "}
                                {progress.improved ? "+" : ""}
                                {progress.progressDiff}%
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Latest Test ({progress.lastDate})
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {progress.lastScore}%
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })()}
                  </Box>

                  {performanceHistory.length > 0 ? (
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 3,
                          flexWrap: "wrap",
                          mb: 3,
                        }}
                      >
                        {/* School Test Performance Graph */}
                        <Box sx={{ flex: 1, minWidth: "300px" }}>
                          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                mb: 2,
                                fontWeight: 500,
                                textAlign: "center",
                              }}
                            >
                              School Test Performance
                            </Typography>
                            <Box sx={{ height: 300 }}>
                              <SimpleLineChart
                                data={schoolTestChartData}
                                colors={subjectColors}
                                height={300}
                                title="School Test Performance by Subject"
                              />
                            </Box>
                            {schoolTestChartData.length === 0 && (
                              <Box sx={{ textAlign: "center", py: 3 }}>
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  No school test data available
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Box>

                        {/* Inkstall Test Performance Graph */}
                        <Box sx={{ flex: 1, minWidth: "300px" }}>
                          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                mb: 2,
                                fontWeight: 500,
                                textAlign: "center",
                              }}
                            >
                              Inkstall Test Performance
                            </Typography>
                            <Box sx={{ height: 300 }}>
                              <SimpleLineChart
                                data={inkstallTestChartData}
                                colors={subjectColors}
                                height={300}
                                title="Inkstall Test Performance by Subject"
                              />
                            </Box>
                            {inkstallTestChartData.length === 0 && (
                              <Box sx={{ textAlign: "center", py: 3 }}>
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  No Inkstall test data available
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Box>
                      </Box>

                      {/* Performance Summary */}
                      <Box sx={{ mt: 3 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 500 }}
                        >
                          Performance Summary for {selectedSubjectFilter}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {/* School Test Performance */}
                          <Paper
                            elevation={2}
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: 2,
                              minWidth: "200px",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                fontWeight: 500,
                                textAlign: "center",
                              }}
                            >
                              School Test Averages
                            </Typography>
                            {Object.keys(subjectColors)
                              .map((subject) => {
                                // Calculate average score for this subject in school tests
                                const subjectEntries =
                                  performanceHistory.filter(
                                    (entry) =>
                                      entry.subject === subject &&
                                      entry.testType === "School Test"
                                  );

                                if (subjectEntries.length === 0) return null;

                                const avgScore =
                                  subjectEntries.reduce(
                                    (sum, entry) =>
                                      sum +
                                      (entry.marks / entry.totalMarks) * 100,
                                    0
                                  ) / subjectEntries.length;

                                return (
                                  <Box
                                    key={subject}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mb: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: "10px",
                                          height: "10px",
                                          backgroundColor:
                                            subjectColors[subject],
                                          marginRight: "5px",
                                          borderRadius: "2px",
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {subject}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                    >
                                      {avgScore.toFixed(1)}%
                                    </Typography>
                                  </Box>
                                );
                              })
                              .filter(Boolean)}
                            {performanceHistory.filter(
                              (entry) => entry.testType === "School Test"
                            ).length === 0 && (
                              <Typography
                                variant="body2"
                                sx={{
                                  textAlign: "center",
                                  py: 1,
                                  color: "text.secondary",
                                }}
                              >
                                No school test data
                              </Typography>
                            )}
                          </Paper>

                          {/* Inkstall Test Performance */}
                          <Paper
                            elevation={2}
                            sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: 2,
                              minWidth: "200px",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                fontWeight: 500,
                                textAlign: "center",
                              }}
                            >
                              Inkstall Test Averages
                            </Typography>
                            {Object.keys(subjectColors)
                              .map((subject) => {
                                // Calculate average score for this subject in inkstall tests
                                const subjectEntries =
                                  performanceHistory.filter(
                                    (entry) =>
                                      entry.subject === subject &&
                                      entry.testType === "Inkstall Test"
                                  );

                                if (subjectEntries.length === 0) return null;

                                const avgScore =
                                  subjectEntries.reduce(
                                    (sum, entry) =>
                                      sum +
                                      (entry.marks / entry.totalMarks) * 100,
                                    0
                                  ) / subjectEntries.length;

                                return (
                                  <Box
                                    key={subject}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mb: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: "10px",
                                          height: "10px",
                                          backgroundColor:
                                            subjectColors[subject],
                                          marginRight: "5px",
                                          borderRadius: "2px",
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {subject}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                    >
                                      {avgScore.toFixed(1)}%
                                    </Typography>
                                  </Box>
                                );
                              })
                              .filter(Boolean)}
                            {performanceHistory.filter(
                              (entry) => entry.testType === "Inkstall Test"
                            ).length === 0 && (
                              <Typography
                                variant="body2"
                                sx={{
                                  textAlign: "center",
                                  py: 1,
                                  color: "text.secondary",
                                }}
                              >
                                No Inkstall test data
                              </Typography>
                            )}
                          </Paper>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No performance data available for graphs
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Performance History Section */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Performance History
                  </Typography>
                  {performanceHistory.length > 0 ? (
                    <Box>
                      {performanceHistory.map((entry) => (
                        <Box
                          key={entry._id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 2,
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 500 }}
                            >
                              {entry.subject}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(
                                entry.submitDateTime
                              ).toLocaleDateString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                entry.submitDateTime
                              ).toLocaleTimeString()}{" "}
                              · {entry.testType}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            {/* Calculate percentage if needed */}
                            <Typography
                              variant="subtitle1"
                              sx={{ color: "#1976D2", fontWeight: "bold" }}
                            >
                              {((entry.marks / entry.totalMarks) * 100).toFixed(
                                1
                              )}
                              %
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.marks}/{entry.totalMarks}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No performance data available
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </MainFrame>
  );
};

export default StudentPerformance;
