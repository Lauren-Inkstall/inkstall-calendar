import CreateForm from '../models/createform.model.js';

// Get all forms
export const getAllForms = async (req, res) => {
  try {
    const { teacherId } = req.query;
    
    // If teacherId is provided, filter events for that teacher
    const query = teacherId ? { teacher: teacherId } : {};
    
    const forms = await CreateForm.find(query);
    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create a new form entry
export const createForm = async (req, res) => {
  try {
    const newForm = new CreateForm(req.body);
    await newForm.save();
    res.status(201).json(newForm);
  } catch (error) {
    res.status(400).json({ message: 'Error creating form', error });
  }
};



// Delete a form by ID
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the form
    const deletedForm = await CreateForm.findByIdAndDelete(id);

    if (!deletedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json({ message: 'Form deleted successfully', deletedForm });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;  // Get the data from the request body

    // Ensure the students field is properly formatted (if updating students)
    if (updateData.students) {
      // Validate that the students field is an array of objects with the correct structure
      for (let student of updateData.students) {
        if (!student.name || !student.attendance) {
          return res.status(400).json({ message: 'Each student must have a name and attendance status.' });
        }
        student.attendance = student.attendance || 'absent';  // Set default attendance to 'absent' if not provided
      }
    }

    // Use the `findByIdAndUpdate` method to partially update the form
    const updatedForm = await CreateForm.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};