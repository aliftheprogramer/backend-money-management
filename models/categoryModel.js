import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['pemasukan', 'pengeluaran'],
    required: true
  },
  icon: {
    type: String,
    default: 'default-icon'
  },
  color: {
    type: String,
    default: '#000000'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;