import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import Wallet from "../models/walletModel.js"; // Add this import

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
    // Overall summary
    const summary = await Transaction.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly summary for the current year
    const currentYear = new Date().getFullYear();
    const monthlySummary = await Transaction.aggregate([
      {
        $match: {
          userId: req.user.id,
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    res.status(200).json({
      summary,
      monthlySummary,
    });
  } catch (error) {
    console.error("Error getting user transaction summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
