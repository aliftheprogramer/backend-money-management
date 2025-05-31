import express from 'express';
import { getWallet } from '../controllers/walletController.js';
import { verifyToken } from '../controllers/authController.js';

const walletRouter = express.Router();

// Get wallet details
walletRouter.get('/ingfo', verifyToken, getWallet);

export default walletRouter;