import Category from "../models/categoryModel.js";
import Transaction from "../models/transactionModel.js";
import Wallet from "../models/walletModel.js";
import { verifyToken } from "../controllers/authController.js";

const addTransactionPengeluaran = async (req, res) => {
  const { transactionName, amount, category, note, date } = req.body;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let transactionCategory = await Category.findOne({
      name: category.trim().toLowerCase(),
    });

    if (!transactionCategory) {
      transactionCategory = new Category({
        name: category.trim().toLowerCase(),
        type: "pengeluaran", // changed to pemasukan for income transactions
        icon: "default-icon", // ADDED: Default icon
        color: "#000000", // ADDED: Default color
      });
      await transactionCategory.save();
    }

    const newTransaction = new Transaction({
      transactionName,
      amount,
      categoryId: transactionCategory._id, // FIXED: Was "transactionCategory"
      category: category.trim().toLowerCase(), // ADDED: Required by model
      note: note || "", // Added default value
      date: date ? new Date(date) : new Date(), // Added default date
      userId: req.user.id,
      type: "pengeluaran", // Set type to 'pengeluaran' for expense transactions
    });

    const savedTransaction = await newTransaction.save();

    const Wallet = await Wallet.findOne({ userId: req.user.id });
    if (Wallet) {
      Wallet.totalBalance -= Number(amount);
      Wallet.availableBalance -= Number(amount);
      Wallet.lastUpdated = new Date();
      await Wallet.save();
    }

    res.status(201).json({
      transaction: savedTransaction,
      categoryType: transactionCategory.type,
      walletBalance: Wallet ? Wallet.totalBalance : null,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addTransactionPemasukan = async (req, res) => {
  const { transactionName, amount, category, note, date } = req.body;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let transactionCategory = await Category.findOne({
      name: category.trim().toLowerCase(),
    });

    if (!transactionCategory) {
      transactionCategory = new Category({
        name: category.trim().toLowerCase(),
        type: "pemasukan", // hanya default nanti bisa di ubah
        icon: "default-icon", // ADDED: Default icon
        color: "#000000", // ADDED: Default color
      });
      await transactionCategory.save();
    }

    const newTransaction = new Transaction({
      transactionName,
      amount,
      categoryId: transactionCategory._id, // FIXED: Was "transactionCategory"
      category: category.trim().toLowerCase(), // ADDED: Required by model
      note: note || "", // Added default value
      date: date ? new Date(date) : new Date(), // Added default date
      userId: req.user.id,
      type: "pemasukan", // Set type to 'pemasukan' for income transactions
    });

    const savedTransaction = await newTransaction.save();

    const Wallet = await Wallet.findOne({ userId: req.user.id });

    if (Wallet) {
      Wallet.totalBalance += Number(amount);
      Wallet.availableBalance += Number(amount);
      Wallet.lastUpdated = new Date();
      await Wallet.save();
    }

    res.status(201).json({
      transaction: savedTransaction,
      categoryType: transactionCategory.type,
      walletBalance: Wallet ? Wallet.totalBalance : null,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const showTransactionPengeluaran = async (req, res) => {
  try {
    const data = await Transaction.find({
      userId: req.user.id,
      type: "pengeluaran",
    })
      .populate("category")
      .sort({ createdAt: -1 }); //sort dari yang terbaru

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const showTransactionPemasukan = async (req, res) => {
  try {
    const data = await Transaction.find({
      userId: req.user.id,
      type: "pemasukan",
    })
      .populate("category")
      .sort({ createdAt: -1 }); //sort dari yang terbaru

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const showTransactionByid = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Looking for transaction with ID:", id);

    // Check if transaction exists AND belongs to the authenticated user
    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id, // Security: Only allow access to user's own transactions
    });

    if (!transaction) {
      console.log("Transaction not found or doesn't belong to user:", id);
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Populate the transaction with related data
    const populatedTransaction = await Transaction.findById(id)
      .populate({
        path: "categoryId",
        select: "name type icon color",
      })
      .populate({
        path: "userId",
        select: "name email",
      });

    // Success - send the transaction data
    res.status(200).json(populatedTransaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid transaction ID format" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

const editTransaction = async (req, res) => {
  try {
    const id = req.params.id;
    const { transactionName, amount, category, note, date } = req.body;

    // Verify transaction exists and belongs to user
    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Handle category change if provided
    let categoryId = transaction.categoryId;
    if (category && category !== transaction.category) {
      // Find or create the new category
      let transactionCategory = await Category.findOne({
        name: category.trim().toLowerCase(),
      });

      if (!transactionCategory) {
        // Create new category with type matching the transaction type
        transactionCategory = new Category({
          name: category.trim().toLowerCase(),
          type: transaction.type, // Keep same type as transaction
          icon: "default-icon",
          color: "#000000",
        });
        await transactionCategory.save();
      }

      categoryId = transactionCategory._id;
    }

    // Update transaction fields
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
        transactionName: transactionName || transaction.transactionName,
        amount: amount || transaction.amount,
        categoryId: categoryId,
        category: category
          ? category.trim().toLowerCase()
          : transaction.category,
        note: note !== undefined ? note : transaction.note,
        date: date ? new Date(date) : transaction.date,
      },
      { new: true, runValidators: true }
    ).populate({
      path: "categoryId",
      select: "name type icon color",
    });

    const amountDifference = amount - transaction.amount;

    // Update Wallet based on transaction type
    if (amountDifference !== 0) {
      const Wallet = await Wallet.findOne({ userId: req.user.id });
      if (Wallet) {
        if (transaction.type === "pemasukan") {
          Wallet.totalBalance += amountDifference;
          Wallet.availableBalance += amountDifference;
        } else {
          Wallet.totalBalance -= amountDifference;
          Wallet.availableBalance -= amountDifference;
        }
        Wallet.lastUpdated = new Date();
        await Wallet.save();
      }
    }

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
      walletBalance: Wallet ? Wallet.totalBalance : null,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const id = req.params.id;

    // Verify transaction exists and belongs to user
    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(id);

    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (wallet) {
      if (transaction.type === "pemasukan") {
        wallet.totalBalance -= Number(transaction.amount);
        wallet.availableBalance -= Number(transaction.amount);
      } else {
        wallet.totalBalance += Number(transaction.amount);
        wallet.availableBalance += Number(transaction.amount);
      }
      wallet.lastUpdated = new Date();
      await wallet.save();
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
      deletedTransaction: {
        id: transaction._id,
        transactionName: transaction.transactionName,
        amount: transaction.amount,
        type: transaction.type,
      },
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid transaction ID format" });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export {
  addTransactionPengeluaran,
  addTransactionPemasukan,
  showTransactionPengeluaran,
  showTransactionPemasukan,
  showTransactionByid,
  editTransaction,
  deleteTransaction,
};
