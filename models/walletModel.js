import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // Ensures one wallet per user
  },
  totalBalance: {
    type: Number,
    required: true,
    default: 0
  },
  availableBalance: {  // Balance not allocated to budgets
    type: Number,
    default: function() {
      return this.totalBalance;
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;