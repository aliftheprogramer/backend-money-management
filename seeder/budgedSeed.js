import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Budget from '../models/budgetModel.js';
import User from '../models/userModel.js';
import Category from '../models/categoryModel.js';

dotenv.config();

// Connect to MongoDB and seed data
async function seedBudgets() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
    
    // Fetch existing users and categories - FIX: Use query instead of filter
    const users = await User.find();
    const categories = await Category.find({ 
      type: { $in: ['expense', 'both'] } 
    });
    
    if (users.length === 0) {
      throw new Error('No users found. Please run user seeder first.');
    }
    
    // Delete existing budgets
    await Budget.deleteMany({});
    console.log('Deleted existing budgets');
    
    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Sample budget data
    const budgetData = [
      // Overall monthly budget
      {
        userId: users[0]._id,
        amount: 5000000, // 5 million IDR
        period: 'monthly',
        category: 'all',
        startDate: monthStart,
        endDate: monthEnd
      },
      
      // Weekly overall budget
      {
        userId: users[0]._id,
        amount: 1250000, // 1.25 million IDR
        period: 'weekly',
        category: 'all',
        startDate: new Date(), // Current date
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days later
      },
      
      // Daily overall budget
      {
        userId: users[0]._id,
        amount: 200000, // 200k IDR
        period: 'daily',
        category: 'all',
        startDate: new Date(), // Current date
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day later
      }
    ];
    
    // Add category-specific budgets if there are expense categories
    if (categories && categories.length > 0) {
      const foodCategory = categories.find(cat => cat.name === 'Makan');
      const transportCategory = categories.find(cat => cat.name === 'Transportasi');
      
      if (foodCategory) {
        budgetData.push({
          userId: users[0]._id,
          amount: 1500000, // 1.5 million IDR
          period: 'monthly',
          category: 'Makan',
          startDate: monthStart,
          endDate: monthEnd
        });
      }
      
      if (transportCategory) {
        budgetData.push({
          userId: users[0]._id,
          amount: 800000, // 800k IDR
          period: 'monthly',
          category: 'Transportasi',
          startDate: monthStart,
          endDate: monthEnd
        });
      }
    }
    
    // Insert new budgets
    const createdBudgets = await Budget.insertMany(budgetData);
    console.log(`${createdBudgets.length} budgets created`);
    
    return createdBudgets;
  } catch (error) {
    console.error('Error seeding budgets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedBudgets().catch(console.error);
}

export { seedBudgets };