import Budget from '../models/budgetModel.js';
import Transaction from '../models/transactionModel.js';
import mongoose from 'mongoose';

// Create a new budget
export const createBudget = async (req, res) => {
  try {
    const { amount, period, category, startDate, endDate } = req.body;
    
    if (!amount || !period || !startDate) {
      return res.status(400).json({ message: "Amount, period, and start date are required" });
    }
    
    // Check if budget in the same category and period already exists
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category: category,
      period: period,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    });
    
    if (existingBudget) {
      return res.status(400).json({ 
        message: `An active ${period} budget for category "${category}" already exists` 
      });
    }
    
    const budget = new Budget({
      userId: req.user.id,
      amount: Number(amount),
      period,
      category: category || 'all',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null
    });
    
    const savedBudget = await budget.save();
    
    res.status(201).json({
      message: "Budget created successfully",
      budget: savedBudget
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all budgets for current user
export const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    // Enrich budget data with spending information
    const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
      const spending = await getBudgetSpending(budget, req.user.id);
      const budgetObj = budget.toObject();
      
      return {
        ...budgetObj,
        spent: spending.spent,
        remaining: budget.amount - spending.spent,
        percentage: budget.amount > 0 ? Math.round((spending.spent / budget.amount) * 100) : 0,
        status: budget.amount > spending.spent ? 'within' : 'exceeded'
      };
    }));
    
    res.status(200).json(enrichedBudgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get budget by id
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    const spending = await getBudgetSpending(budget, req.user.id);
    const budgetObj = budget.toObject();
    
    // Get recent transactions for this budget
    const recentTransactions = await getRecentTransactionsForBudget(budget, req.user.id);
    
    res.status(200).json({
      ...budgetObj,
      spent: spending.spent,
      remaining: budget.amount - spending.spent,
      percentage: budget.amount > 0 ? Math.round((spending.spent / budget.amount) * 100) : 0,
      status: budget.amount > spending.spent ? 'within' : 'exceeded',
      recentTransactions
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update budget
export const updateBudget = async (req, res) => {
  try {
    const { amount, category, period, startDate, endDate } = req.body;
    
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    // Update fields
    if (amount) budget.amount = Number(amount);
    if (category) budget.category = category;
    if (period) budget.period = period;
    if (startDate) budget.startDate = new Date(startDate);
    if (endDate) budget.endDate = new Date(endDate);
    
    const updatedBudget = await budget.save();
    const spending = await getBudgetSpending(updatedBudget, req.user.id);
    
    res.status(200).json({
      message: "Budget updated successfully",
      budget: {
        ...updatedBudget.toObject(),
        spent: spending.spent,
        remaining: updatedBudget.amount - spending.spent,
        percentage: updatedBudget.amount > 0 ? Math.round((spending.spent / updatedBudget.amount) * 100) : 0
      }
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete budget
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    await Budget.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      message: "Budget deleted successfully",
      id: req.params.id
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Check budget status and get warnings/alerts
export const getBudgetAlerts = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      userId: req.user.id,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ]
    });
    
    const alerts = [];
    
    for (const budget of budgets) {
      const spending = await getBudgetSpending(budget, req.user.id);
      const remaining = budget.amount - spending.spent;
      const percentage = budget.amount > 0 ? Math.round((spending.spent / budget.amount) * 100) : 0;
      
      // Generate warnings based on budget usage
      if (percentage >= 90 && remaining >= 0) {
        alerts.push({
          type: 'warning',
          message: `Your ${budget.period} budget for ${budget.category} is at ${percentage}% (${remaining} remaining)`,
          budgetId: budget._id,
          category: budget.category,
          percentage
        });
      } else if (remaining < 0) {
        alerts.push({
          type: 'danger',
          message: `You've exceeded your ${budget.period} budget for ${budget.category} by ${Math.abs(remaining)}`,
          budgetId: budget._id,
          category: budget.category,
          percentage
        });
      } else if (percentage >= 75) {
        alerts.push({
          type: 'info',
          message: `You've used ${percentage}% of your ${budget.period} budget for ${budget.category}`,
          budgetId: budget._id,
          category: budget.category,
          percentage
        });
      }
    }
    
    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error getting budget alerts:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Helper function to get spending for a budget
async function getBudgetSpending(budget, userId) {
  const today = new Date();
  let startDate, endDate;
  
  // Determine date range based on period
  switch (budget.period) {
    case 'daily':
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      // Start of current week (Sunday)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
      // End of current week (Saturday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      // Start of current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      // End of current month
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    default:
      startDate = budget.startDate;
      endDate = budget.endDate || new Date(2099, 11, 31);
  }
  
  // Query for transactions that match the budget criteria
  const query = {
    userId: mongoose.Types.ObjectId.createFromHexString(userId.toString()),
    type: 'pengeluaran',
    date: { $gte: startDate, $lte: endDate }
  };
  
  // If budget has a specific category, filter by that
  if (budget.category && budget.category !== 'all') {
    query.category = budget.category;
  }
  
  // Calculate total spending
  const result = await Transaction.aggregate([
    { $match: query },
    { $group: {
      _id: null,
      spent: { $sum: '$amount' }
    }}
  ]);
  
  return { spent: result.length > 0 ? result[0].spent : 0 };
}

// Helper function to get recent transactions for a budget
async function getRecentTransactionsForBudget(budget, userId) {
  const today = new Date();
  let startDate, endDate;
  
  // Set date range based on period
  switch (budget.period) {
    case 'daily':
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    default:
      startDate = budget.startDate;
      endDate = budget.endDate || new Date(2099, 11, 31);
  }
  
  // Query criteria
  const query = {
    userId: userId,
    type: 'pengeluaran',
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (budget.category && budget.category !== 'all') {
    query.category = budget.category;
  }
  
  // Get the 5 most recent transactions for this budget
  return await Transaction.find(query)
    .sort({ date: -1 })
    .limit(5)
    .populate({
      path: 'categoryId',
      select: 'name icon color'
    });
}