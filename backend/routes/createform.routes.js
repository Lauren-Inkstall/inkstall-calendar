import express from 'express';
const router = express.Router();
import * as createFormController from '../controllers/createform.controller.js';

// Route to get all events
router.get('/', createFormController.getAllForms);

// Route to create a new event
router.post('/', createFormController.createForm);

// Route to delete an event by ID
router.delete('/:id', createFormController.deleteForm);

// Route to update an event by ID
router.patch('/:id', createFormController.updateForm);

export default router;