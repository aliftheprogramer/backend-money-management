import dotenv from 'dotenv';
import { seedUsers } from './userSeed.js';
import { seedCategories } from './categorySeed.js';
import { seedTransactions } from './transactionSeed.js';
import { seedBudgets } from './budgedSeed.js';
import { seedWallets } from './walletSeed.js';  // Add this line

dotenv.config();

async function runAllSeeders() {
  try {
    console.log('Running all seeders...');
    
    console.log('\n----- SEEDING USERS -----');
    await seedUsers();
    
    console.log('\n----- SEEDING WALLETS -----');
    await seedWallets();  // Add this line - should run after users but before transactions
    
    console.log('\n----- SEEDING CATEGORIES -----');
    await seedCategories();
    
    console.log('\n----- SEEDING TRANSACTIONS -----');
    await seedTransactions();
    
    console.log('\n----- SEEDING BUDGETS -----');
    await seedBudgets();
    
    console.log('\nAll seeders completed successfully!');
  } catch (error) {
    console.error('Error running seeders:', error);
  }
}

runAllSeeders().catch(console.error);