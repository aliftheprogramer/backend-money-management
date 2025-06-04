// filepath: e:\semester 6\back-end\tugas_kelompok\routes\authRoutes.js
import express from 'express';
import { register, login, getCurrentUser, verifyToken } from '../controllers/authController.js';

const authRouter = express.Router();

// Register route
authRouter.post('/register', register);

// Login route
authRouter.post('/login', login);

// Get current user route (protected)
authRouter.get('/me', verifyToken, getCurrentUser);


export default authRouter;