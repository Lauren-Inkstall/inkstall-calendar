import { useState, useContext } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, IconButton, Grid, 
  Typography, Box, Divider, Paper, FormControl,
  InputLabel, Select, FormHelperText
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import { InfoContext } from '../context/InfoContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function EditStudentModal({ student, onClose, onSubmit }) {
    const { grades, boards, branches } = useContext(InfoContext);
    
    const [formData, setFormData] = useState({
        studentName: student.studentName || student.name || '',
        grade: student.grade || '',
        board: student.board || '',
        school: typeof student.school === 'object' ? student.school.name || '' : student.school || '',
        status: student.status?.toLowerCase() || '',
        branch: student.branch || '',
        academicYear: student.academicYear || '',
        contactInformation: Array.isArray(student.contactInformation) 
        ? student.contactInformation 
        : Array.isArray(student.phoneNumbers) 
            ? student.phoneNumbers.map(phone => ({
                relation: phone.relation || 'guardian',
                number: phone.number || '',
                relationName: phone.relationName || '',
                educationQualification: phone.educationQualification || '',
                nameOfOrganisation: phone.nameOfOrganisation || '',
                designation: phone.designation || '',
                Department: phone.Department || ''
            }))
            : [{
                relation: 'guardian',
                number: '',
                relationName: '',
                educationQualification: '',
                nameOfOrganisation: '',
                designation: '',
                Department: ''
            }]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleContactChange = (index, field, value) => {
        const newContacts = [...formData.contactInformation];
        newContacts[index][field] = value;
        setFormData(prev => ({
            ...prev,
            contactInformation: newContacts
        }));
    };
    
    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contactInformation: [
                ...prev.contactInformation,
                {
                    relation: 'guardian',
                    number: '',
                    relationName: '',
                    educationQualification: '',
                    nameOfOrganisation: '',
                    designation: '',
                    Department: ''
                }
            ]
        }));
    };
    
    const removeContact = (index) => {
        const newContacts = [...formData.contactInformation];
        newContacts.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            contactInformation: newContacts
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Ensure all contact information is valid
        const validContacts = formData.contactInformation.filter(
            contact => contact.number && contact.number.trim() !== ''
        );
        
        // Create a copy of the form data with valid contacts
        const submissionData = {
            ...formData,
            contactInformation: validContacts
        };
        
        console.log('Submitting student data with contacts:', submissionData);
        onSubmit(submissionData);
    };

    return (
        <Dialog 
            open={true} 
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{
                sx: { 
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Edit Student</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <form onSubmit={handleSubmit} id="edit-student-form">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Student Name"
                                name="studentName"
                                value={formData.studentName}
                                onChange={handleChange}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Student ID"
                                value={student.studentId || ''}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                disabled
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="grade-label">Grade</InputLabel>
                                <Select
                                    labelId="grade-label"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    label="Grade"
                                >
                                    {grades && grades.length > 0 ? (
                                        grades.map((grade) => (
                                            <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                                        ))
                                    ) : (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                                            <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="board-label">Board</InputLabel>
                                <Select
                                    labelId="board-label"
                                    name="board"
                                    value={formData.board}
                                    onChange={handleChange}
                                    label="Board"
                                >
                                    {boards && boards.length > 0 ? (
                                        boards.map((board) => (
                                            <MenuItem key={board._id} value={board.name}>{board.name}</MenuItem>
                                        ))
                                    ) : (
                                        ['CBSE', 'ICSE', 'IGCSE', 'STATE'].map(board => (
                                            <MenuItem key={board} value={board}>{board}</MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="School"
                                name="school"
                                value={formData.school}
                                onChange={handleChange}
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value="admission due">Admission Due</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="branch-label">Branch</InputLabel>
                                <Select
                                    labelId="branch-label"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    label="Branch"
                                >
                                    {branches && branches.length > 0 ? (
                                        branches.map((branch) => (
                                            <MenuItem key={branch._id} value={branch.name}>{branch.name}</MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="Goregoan West">Goregoan West</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" required>
                                <InputLabel id="academic-year-label">Academic Year</InputLabel>
                                <Select
                                    labelId="academic-year-label"
                                    name="academicYear"
                                    value={formData.academicYear}
                                    onChange={handleChange}
                                    label="Academic Year"
                                >
                                    {["2024-2025", "2025-2026"].map((year) => (
                                        <MenuItem key={year} value={year}>{year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box mt={4} mb={2}>
                        <Typography variant="h6">Contact Information</Typography>
                        <Divider />
                    </Box>
                    
                    {formData.contactInformation.map((contact, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 3, mb: 3, position: 'relative' }}>
                            <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => removeContact(index)}
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                <Delete />
                            </IconButton>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth margin="normal" required>
                                        <InputLabel id={`relation-label-${index}`}>Relation</InputLabel>
                                        <Select
                                            labelId={`relation-label-${index}`}
                                            value={contact.relation}
                                            onChange={(e) => handleContactChange(index, 'relation', e.target.value)}
                                            label="Relation"
                                        >
                                            <MenuItem value="father">Father</MenuItem>
                                            <MenuItem value="mother">Mother</MenuItem>
                                            <MenuItem value="guardian">Guardian</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Phone Number"
                                        value={contact.number}
                                        onChange={(e) => handleContactChange(index, 'number', e.target.value)}
                                        fullWidth
                                        required
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Name"
                                        value={contact.relationName}
                                        onChange={(e) => handleContactChange(index, 'relationName', e.target.value)}
                                        fullWidth
                                        required
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Education"
                                        value={contact.educationQualification}
                                        onChange={(e) => handleContactChange(index, 'educationQualification', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Organization"
                                        value={contact.nameOfOrganisation}
                                        onChange={(e) => handleContactChange(index, 'nameOfOrganisation', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Designation"
                                        value={contact.designation}
                                        onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Department"
                                        value={contact.Department}
                                        onChange={(e) => handleContactChange(index, 'Department', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                    
                    <Button
                        startIcon={<Add />}
                        onClick={addContact}
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1, mb: 3 }}
                    >
                        Add Contact
                    </Button>
                </form>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    form="edit-student-form" 
                    color="primary" 
                    variant="contained"
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditStudentModal;