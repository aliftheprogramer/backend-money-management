import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Wallet from "../models/walletModel.js"; // Add this import
import mongoose from 'mongoose';

// Get user profile (detailed information about the authenticated user)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user statistics
    const transactionStats = await Transaction.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Create structured format with separate pemasukan and pengeluaran stats
    const stats = {
      pemasukan: { total: 0, count: 0 },
      pengeluaran: { total: 0, count: 0 },
      totalCount: 0,
      netBalance: 0,
    };

    // Fill in actual values from aggregation results
    transactionStats.forEach((stat) => {
      if (stat._id === "pemasukan" || stat._id === "pengeluaran") {
        stats[stat._id].total = stat.total;
        stats[stat._id].count = stat.count;
        stats.totalCount += stat.count;
      }
    });

    // Calculate net balance (income - expenses)
    stats.netBalance = stats.pemasukan.total - stats.pengeluaran.total;

    // Get wallet information
    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet && stats.totalCount > 0) {
      // Create wallet with calculated balance from existing transactions
      wallet = new Wallet({
        userId: user._id,
        totalBalance: stats.netBalance,
        availableBalance: stats.netBalance,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });

      await wallet.save();
      console.log(
        `Created wallet for user ${user._id} with initial balance ${stats.netBalance}`
      );
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: stats,
      wallet: wallet
        ? {
            id: wallet._id,
            totalBalance: wallet.totalBalance,
            availableBalance: wallet.availableBalance,
            lastUpdated: wallet.lastUpdated,
          }
        : null,
      joinedSince: Math.floor(
        (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
      ), // days
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Find user and update
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name,
        email: email,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's transaction summary
export const getUserTransactionSummary = async (req, res) => {
  try {
    // Use ID from URL parameter, not from token
    const userId = req.params.id || req.user.id;
    
    // Cek apakah ID yang diminta adalah milik pengguna saat ini
    const isOwnData = userId === req.user.id.toString();
    
    // Tambahkan pemeriksaan keamanan
    if (!isOwnData && !req.user.isAdmin) {
      return res.status(403).json({ 
        message: "Tidak bisa melihat data transaksi pengguna lain" 
      });
    }
    
    // Konversi ke ObjectId dengan cara lebih fleksibel
    // Kode lainnya...
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    // Cek transaksi dengan query langsung untuk verifikasi
    const transactionSample = await Transaction.findOne({ userId: userObjectId }).lean();
    
    if (!transactionSample) {
      return res.status(200).json({
        summary: {},
        monthlySummary: [],
        message: "Tidak ada transaksi untuk user ini"
      });
    }
    
    // Gunakan userObjectId yang sama untuk semua query
    // Lanjutkan dengan kode yang sudah ada...
    // Overall summary
    const summary = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      { $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Monthly summary - include all years, not just current
    const monthlySummary = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
      { $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { 
          "_id.year": -1, 
          "_id.month": 1 
        } 
      }
    ]);
    
    // Check if we got data
    if (summary.length === 0 && monthlySummary.length === 0) {
      console.log(`No transactions found for user ID: ${userId}`);
    }
    
    // Format for better readability
    const formattedSummary = {};
    summary.forEach(item => {
      formattedSummary[item._id] = {
        total: item.total,
        count: item.count
      };
    });
    
    // Format monthly data into readable structure
    const formattedMonthly = monthlySummary.map(item => ({
      year: item._id.year,
      month: item._id.month,
      type: item._id.type,
      total: item.total,
      count: item.count
    }));
    
    res.status(200).json({
      summary: formattedSummary,
      monthlySummary: formattedMonthly,
      // Debug info to help diagnose issues
      debug: {
        requestedUserId: userId,
        tokenUserId: req.user.id,
        transactionsExist: await Transaction.exists({ userId: userObjectId })
      }
    });
  } catch (error) {
    console.error("Error getting user transaction summary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      // Help identify potential ObjectId issues
      errorType: error.name 
    });
  }
};
