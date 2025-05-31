import e from "express";

const userRouter = e.Router();

import { getUserProfile, updateUserProfile, getUserTransactionSummary  } from '../controllers/userController.js';
import { verifyToken } from "../controllers/authController.js";


userRouter.get('/profile/:id', verifyToken, getUserProfile);
userRouter.put('/profile', verifyToken, updateUserProfile);
userRouter.get('/summary', verifyToken, getUserTransactionSummary);

export default userRouter;