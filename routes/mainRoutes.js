import e from "express";
import { addTransactionPemasukan, addTransactionPengeluaran, deleteTransaction, editTransaction, showTransactionByid, showTransactionPemasukan, showTransactionPengeluaran} from "../controllers/mainController.js";
import { verifyToken } from '../controllers/authController.js';

const router = e.Router();

router.post("/transaction/pengeluaran",verifyToken, addTransactionPengeluaran);
router.post("/transaction/pemasukan", verifyToken, addTransactionPemasukan);
router.get("/transaction/pengeluaran",verifyToken, showTransactionPengeluaran);
router.get("/transaction/pemasukan", verifyToken, showTransactionPemasukan); 
router.get("/transaction/:id", verifyToken, showTransactionByid);
router.put("/transaction/:id", verifyToken, editTransaction);
router.delete("/transaction/:id", verifyToken, deleteTransaction);

export default router;