import Wallet from '../models/walletModel.js';
import Transaction from '../models/transactionModel.js';
import mongoose from 'mongoose';

// Get user's current wallet balance - with auto-creation if needed
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    // If wallet doesn't exist, create one and initialize based on transaction history
    if (!wallet) {
      // Calculate balance from existing transactions
      const transactionStats = await Transaction.aggregate([
        { $match: { userId: mongoose.Types.ObjectId.createFromHexString(req.user.id) } },
        { $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }}
      ]);
      
      // Create structured format for calculations
      const stats = {
        pemasukan: 0,
        pengeluaran: 0
      };
      
      // Fill in actual values from aggregation results
      transactionStats.forEach(stat => {
        if (stat._id === 'pemasukan' || stat._id === 'pengeluaran') {
          stats[stat._id] = stat.total;
        }
      });
      
      // Create new wallet with calculated balance
      const totalBalance = stats.pemasukan - stats.pengeluaran;
      
      wallet = new Wallet({
        userId: req.user.id,
        totalBalance: totalBalance,
        availableBalance: totalBalance,
        lastUpdated: new Date(),
        createdAt: new Date()
      });
      
      await wallet.save();
      console.log(`Created wallet for user ${req.user.id} with initial balance ${totalBalance}`);
    }
    
    res.status(200).json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};