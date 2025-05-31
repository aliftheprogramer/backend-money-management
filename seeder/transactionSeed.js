import mongoose from "mongoose";
import dotenv from "dotenv";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import { type } from "os";

dotenv.config();

// Connect to MongoDB and seed data
async function seedTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("Connected to MongoDB");

    // Fetch existing users and categories
    const users = await User.find();
    const categories = await Category.find();

    if (users.length === 0 || categories.length === 0) {
      throw new Error(
        "No users or categories found. Please run user and category seeders first."
      );
    }

    // Delete existing transactions
    await Transaction.deleteMany({});
    console.log("Deleted existing transactions");

    // Sample transaction data using actual user and category IDs
    const transactionData = [];

    // Get user IDs
    const userId = users[0]._id;

    // Get category IDs by type
    const expenseCategories = categories.filter(
      (cat) => cat.type === "pengeluaran"
    );
    const incomeCategories = categories.filter(
      (cat) => cat.type === "pemasukan"
    );

    if (expenseCategories.length === 0 || incomeCategories.length === 0) {
      console.warn(
        "Warning: No categories found for one or both types. Check your category data."
      );
      console.log("Expense categories found:", expenseCategories.length);
      console.log("Income categories found:", incomeCategories.length);
    }

    // Generate transactions for the past month
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Generate random transactions
    const endTime = endDate.getTime();
    for (
      let d = new Date(startDate);
      d.getTime() <= endTime;
      d.setDate(d.getDate() + 1)
    ) {
      // For expense transactions - ADD the type field
      if (expenseCategories.length > 0) {
        const expenseCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < expenseCount; i++) {
          const randCategory =
            expenseCategories[
              Math.floor(Math.random() * expenseCategories.length)
            ];
          const transactionName = `${randCategory.name} Expense`;
          transactionData.push({
            userId: userId,
            categoryId: randCategory._id,
            type: "pengeluaran", // ADD THIS LINE - required field
            transactionName: transactionName,
            amount: Math.floor(Math.random() * 100000) + 10000,
            category: randCategory.name,
            note: `${randCategory.name} hari ${d.getDate()}/${
              d.getMonth() + 1
            }`,
            date: new Date(d),
          });
        }
      }

      // For income transactions - FIX random type assignment
      if (incomeCategories.length > 0 && d.getDate() % 5 === 0) {
        const randCategory =
          incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
        const transactionName = `${randCategory.name} Income`;
        // Remove this random type assignment - it should always be "pemasukan"
        // const transactionType = Math.random() < 0.5 ? "pemasukan" : "pengeluaran";
        transactionData.push({
          userId: userId,
          categoryId: randCategory._id,
          type: "pemasukan", // Always use "pemasukan" for income transactions
          transactionName: transactionName,
          amount: Math.floor(Math.random() * 1000000) + 500000,
          category: randCategory.name,
          note: `${randCategory.name} hari ${d.getDate()}/${d.getMonth() + 1}`,
          date: new Date(d),
        });
      }
    }

    // Insert new transactions
    const createdTransactions = await Transaction.insertMany(transactionData);
    console.log(`${createdTransactions.length} transactions created`);

    return createdTransactions;
  } catch (error) {
    console.error("Error seeding transactions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedTransactions().catch(console.error);
}

export { seedTransactions };
