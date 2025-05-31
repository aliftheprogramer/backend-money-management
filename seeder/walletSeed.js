import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Wallet from '../models/walletModel.js';
import User from '../models/userModel.js';

dotenv.config();

// Sample initial balance data (optional - you can customize this)
const initialBalances = {
  'alif@example.com': 5000000,  // 5 million IDR
  'budi@example.com': 3500000,  // 3.5 million IDR
  'citra@example.com': 4200000, // 4.2 million IDR
};

// Connect to MongoDB and seed wallets
async function seedWallets() {
  let connection;
  
  try {
    connection = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
    
    // Delete existing wallets
    await Wallet.deleteMany({});
    console.log('Deleted existing wallets');
    
    // Get all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found. Please run user seeder first.');
      return;
    }
    
    // Create wallet data
    const walletData = users.map(user => ({
      userId: user._id,
      totalBalance: initialBalances[user.email] || 1000000, // Default 1 million IDR if not specified
      availableBalance: initialBalances[user.email] || 1000000,
      lastUpdated: new Date(),
      createdAt: new Date()
    }));
    
    // Insert new wallets
    const createdWallets = await Wallet.insertMany(walletData);
    console.log(`${createdWallets.length} wallets created`);
    
    // Log created wallets
    console.log('Created wallets:');
    for (const wallet of createdWallets) {
      const user = users.find(user => user._id.toString() === wallet.userId.toString());
      console.log(`User: ${user?.name}, Wallet ID: ${wallet._id}, Balance: ${wallet.totalBalance}`);
    }
    
    return createdWallets;
  } catch (error) {
    console.error('Error seeding wallets:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedWallets().catch(console.error);
}

export { seedWallets };