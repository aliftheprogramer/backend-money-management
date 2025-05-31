import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

// Sample user data
const userData = [
  {
    name: 'Alif Arya',
    email: 'alif@example.com',
    passwordHash: 'hashedpassword123', // In production, use bcrypt to hash passwords
  },
  {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    passwordHash: 'hashedpassword456',
  },
  {
    name: 'Citra Dewi',
    email: 'citra@example.com',
    passwordHash: 'hashedpassword789',
  }
];

// Connect to MongoDB and seed data
async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
    
    // Delete existing users
    await User.deleteMany({});
    console.log('Deleted existing users');
    
    // Insert new users
    const createdUsers = await User.insertMany(userData);
    console.log(`${createdUsers.length} users created`);
    
    // Log created user IDs for reference (useful for other seeders)
    console.log('User IDs for reference:');
    createdUsers.forEach(user => {
      console.log(`${user.name}: ${user._id}`);
    });
    
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedUsers().catch(console.error);
}

export { seedUsers };