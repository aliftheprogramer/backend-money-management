import e from "express";

const userRouter = e.Router();

import { getUserProfile, updateUserProfile, getUserTransactionSummary  } from '../controllers/userController.js';
import { verifyToken } from "../controllers/authController.js";


userRouter.get('/profile/:id', verifyToken, getUserProfile);
userRouter.put('/profile/:id', verifyToken, updateUserProfile);
userRouter.get('/summary/:id', verifyToken, getUserTransactionSummary);

export default userRouter;