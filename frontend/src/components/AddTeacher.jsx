import React, { useState, useContext, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Button,
  Select,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import {
  LocalizationProvider,
  TimePicker,
  DatePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { SubjectsContext } from "../context/SubjectsContext";
import { InfoContext } from "../context/InfoContext";
import { Upload } from "lucide-react";
import CancelIcon from "@mui/icons-material/Cancel";

const AddTeacher = () => {
  const { register, control, setValue, watch, getValues } = useFormContext();

  // Default times as strings
  const defaultStartTime = "09:00";
  const defaultEndTime = "17:00";

  // Fetch subjects from SubjectsContext instead of hardcoding them
  const { subjects: subjectsData, loading: subjectsLoading } =
    useContext(SubjectsContext);
  const { branches } = useContext(InfoContext);

  // Days keys matching your schema
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Handle delete branch from multi-select
  const handleDeleteBranch = (branchToDelete, currentBranches, onChange) => {
    const updatedBranches = currentBranches.filter(
      (branch) => branch !== branchToDelete
    );
    onChange(updatedBranches);
  };

  // File change handler for other documents (e.g. Offer Letter)
  const handleFileChange = (field) => (event) => {
    setValue(field, event.target.files[0]);
  };
  // Set initial random color on component mount
  useEffect(() => {
    // Start with empty color field so backend will generate one
    setValue("color", "");
  }, [setValue]);

  return (
    <Box sx={{ maxWidth: 1200, pt: 4, mx: "auto" }}>
      {/* Rest of component remains the same */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="startingDate"
            control={control}
            rules={{ required: "Starting Date is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Starting Date"
                  value={value ? dayjs(value, "DD:MM:YYYY") : null}
                  onChange={(newValue) =>
                    onChange(newValue ? newValue.format("DD:MM:YYYY") : "")
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                      InputProps: { sx: { "& input": { fontSize: "14px" } } },
                      InputLabelProps: { sx: { fontSize: "14px" } },
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="branches"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Branch"
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((branch) => (
                        <Chip
                          key={branch}
                          label={branch}
                          onDelete={(event) => {
                            event.stopPropagation();
                            handleDeleteBranch(
                              branch,
                              field.value,
                              field.onChange
                            );
                          }}
                          deleteIcon={
                            <CancelIcon
                              onMouseDown={(event) => event.stopPropagation()}
                            />
                          }
                        />
                      ))}
                    </Box>
                  ),
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 48 * 4.5,
                        width: 250,
                      },
                    },
                  },
                }}
              >
                {branches &&
                  branches.map((branch) => (
                    <MenuItem
                      key={branch._id || branch}
                      value={branch.name || branch}
                    >
                      {branch.name || branch}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          />
        </Grid>
      </Grid>

      {/* About Me Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontSize: "16px" }}>
          About Me
        </Typography>
        <Controller
          name="aboutMe"
          control={control}
          rules={{ required: "About Me is required" }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              multiline
              rows={4}
              placeholder="Write a brief description about yourself..."
              error={!!error}
              helperText={error?.message}
              InputProps={{ sx: { "& textarea": { fontSize: "14px" } } }}
              InputLabelProps={{ sx: { fontSize: "14px" } }}
            />
          )}
        />
      </Box>

      {/* Subjects Section using SubjectsContext */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontSize: "16px" }}>
          Subjects
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {subjectsData &&
            subjectsData.map((subjectObj) => (
              <Controller
                key={subjectObj.name}
                name="subjects"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value.includes(subjectObj.name)}
                        onChange={(e) => {
                          const newSubjects = e.target.checked
                            ? [...field.value, subjectObj.name]
                            : field.value.filter((s) => s !== subjectObj.name);
                          field.onChange(newSubjects);
                        }}
                        sx={{ "& .MuiSvgIcon-root": { fontSize: "1rem" } }}
                      />
                    }
                    label={subjectObj.name}
                    sx={{
                      margin: 0,
                      "& .MuiFormControlLabel-label": { fontSize: "14px" },
                    }}
                  />
                )}
              />
            ))}
        </Box>
      </Box>

      {/* Document Upload (Offer Letter, optional) */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontSize: "16px" }}>
          Offer Letter (Optional)
        </Typography>
        <input
          type="file"
          id="document"
          hidden
          {...register("document")}
          onChange={handleFileChange("document")}
        />
        <label htmlFor="document">
          <IconButton component="span">
            <Upload size={20} />
          </IconButton>
        </label>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ fontSize: "14px" }}
        >
          {watch("document")?.name || "Choose File: No file chosen"}
        </Typography>
      </Box>

      {/* Salary Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontSize: "16px" }}>
          Salary
        </Typography>
        <Controller
          name="salary.type"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} row sx={{ mb: 1 }}>
              <FormControlLabel
                value="hourly"
                control={<Radio size="small" />}
                label="Hourly Rate"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
              />
              <FormControlLabel
                value="monthly"
                control={<Radio size="small" />}
                label="Monthly Salary"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
              />
            </RadioGroup>
          )}
        />
        <Controller
          name="salary.amount"
          control={control}
          rules={{ required: "Salary is required" }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              type="number"
              label={
                watch("salary.type") === "hourly"
                  ? "Hourly Rate (₹/hr)"
                  : "Monthly Salary (₹)"
              }
              error={!!error}
              helperText={error?.message}
              size="small"
              sx={{
                "& .MuiInputBase-root": { fontSize: "14px" },
                "& .MuiInputLabel-root": { fontSize: "14px" },
              }}
              InputProps={{
                startAdornment: (
                  <Typography sx={{ fontSize: "14px", mr: 0.5 }}>₹</Typography>
                ),
                inputProps: {
                  min: 0,
                  step: watch("salary.type") === "hourly" ? "0.01" : "1",
                },
              }}
            />
          )}
        />
      </Box>

      {/* Work Hours */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontSize: "16px" }}>
          Work Hours
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {days.map((day) => (
              <Grid item xs={12} sm={6} key={day}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ minWidth: 100, fontSize: "14px" }}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Start Time */}
                    <Controller
                      name={`workingHours.${day}.startTime`}
                      control={control}
                      render={({
                        field: { onChange, value, ...restField },
                      }) => (
                        <TimePicker
                          {...restField}
                          label="Start Time"
                          value={
                            value
                              ? dayjs(value, "HH:mm")
                              : dayjs(defaultStartTime, "HH:mm")
                          }
                          onChange={(newValue) =>
                            onChange(newValue ? newValue.format("HH:mm") : "")
                          }
                          slotProps={{
                            textField: {
                              size: "small",
                              sx: {
                                "& .MuiInputBase-input": { fontSize: "14px" },
                                "& .MuiInputLabel-root": { fontSize: "14px" },
                              },
                            },
                          }}
                          sx={{ flex: 1 }}
                        />
                      )}
                    />
                    {/* End Time */}
                    <Controller
                      name={`workingHours.${day}.endTime`}
                      control={control}
                      render={({
                        field: { onChange, value, ...restField },
                      }) => (
                        <TimePicker
                          {...restField}
                          label="End Time"
                          value={
                            value
                              ? dayjs(value, "HH:mm")
                              : dayjs(defaultEndTime, "HH:mm")
                          }
                          onChange={(newValue) =>
                            onChange(newValue ? newValue.format("HH:mm") : "")
                          }
                          slotProps={{
                            textField: {
                              size: "small",
                              sx: {
                                "& .MuiInputBase-input": { fontSize: "14px" },
                                "& .MuiInputLabel-root": { fontSize: "14px" },
                              },
                            },
                          }}
                          sx={{ flex: 1 }}
                        />
                      )}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </LocalizationProvider>
      </Box>
    </Box>
  );
};

export default AddTeacher;
