import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/categoryModel.js';

dotenv.config();

// Sample category data
const categoryData = [
  {
    name: 'gaji',
    type: 'pemasukan',
    icon: 'income',
    color: '#FF5733'
  },
  {
    name: 'makanan',
    type: 'pengeluaran',
    icon: 'outcome',
    color: '#F44336'
  },
  {
    name: 'liburan',
    type: 'pengeluaran',
    icon: 'outcome',
    color: '#F44336'
  },

];

// Connect to MongoDB and seed data
async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('Connected to MongoDB');
    
    // Delete existing categories
    await Category.deleteMany({});
    console.log('Deleted existing categories');
    
    // Insert new categories
    const createdCategories = await Category.insertMany(categoryData);
    console.log(`${createdCategories.length} categories created`);
    
    // Log created category IDs for reference
    console.log('Category IDs for reference:');
    createdCategories.forEach(category => {
      console.log(`${category.name}: ${category._id}`);
    });
    
    return createdCategories;
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedCategories().catch(console.error);
}

export { seedCategories };