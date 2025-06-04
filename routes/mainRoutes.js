import e from "express";
import { 
  addTransactionPemasukan, 
  addTransactionPengeluaran,
  deleteTransaction,
  editTransaction,
  showTransactionByid,
  showTransactionPemasukan,
  showTransactionPengeluaran,
  getTransactionsSortedByDate,
  getTransactionsSortedByAmount 
} from "../controllers/mainController.js";
import { verifyToken } from '../controllers/authController.js';

const router = e.Router();

// POST routes
router.post("/transaction/pengeluaran", verifyToken, addTransactionPengeluaran);
router.post("/transaction/pemasukan", verifyToken, addTransactionPemasukan);

// Special GET routes for sorted transactions - PLACE THESE FIRST
router.get('/transactions/by-date', verifyToken, getTransactionsSortedByDate);
router.get('/transactions/by-amount', verifyToken, getTransactionsSortedByAmount);

// Regular transaction routes
router.get("/transaction/pengeluaran", verifyToken, showTransactionPengeluaran);
router.get("/transaction/pemasukan", verifyToken, showTransactionPemasukan); 
router.get("/transaction/:id", verifyToken, showTransactionByid);
router.put("/transaction/:id", verifyToken, editTransaction);
router.delete("/transaction/:id", verifyToken, deleteTransaction);

export default router;