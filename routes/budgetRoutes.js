import express from 'express';
import { 
  createBudget, 
  getAllBudgets, 
  getBudgetById, 
  updateBudget, 
  deleteBudget,
  getBudgetAlerts 
} from '../controllers/budgetController.js';
import { verifyToken } from '../controllers/authController.js';

const budgetRouter = express.Router();

// Create new budget
budgetRouter.post('/', verifyToken, createBudget);

// Get all budgets for current user
budgetRouter.get('/', verifyToken, getAllBudgets);

// Get budget alerts/warnings
budgetRouter.get('/alerts', verifyToken, getBudgetAlerts);

// Get budget by id
budgetRouter.get('/:id', verifyToken, getBudgetById);

// Update budget
budgetRouter.put('/:id', verifyToken, updateBudget);

// Delete budget
budgetRouter.delete('/:id', verifyToken, deleteBudget);

export default budgetRouter;