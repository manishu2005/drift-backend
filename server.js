import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('./.env') });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import connectDb from './tempDatabase/db.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import captainRoutes from './routes/captainRoutes.js';
import passport from 'passport';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js'
import {createServer} from 'http';
import {Server} from 'socket.io';

import Ride from './models/rideModel.js'
import rideRoutes from './routes/rideRoutes.js';
import initSocketHandlers, { getConnectedCaptains } from './socket/socketServer.js';
await import("./utils/googleAuth.js");

const app = express();

app.use(cors({
  origin: ['http://localhost:5173',"https://drift-your-rideing-partner.netlify.app"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDb();


app.use(session({ secret: 'sessionsecret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/', (req, res) => res.send('Server is running'));
app.use('/users', userRoutes);
app.use('/captain', captainRoutes);
app.use('/api/auth',authRoutes);
app.use('/api/rides', (await import('./routes/rideRoutes.js')).default);


// const httpServer = createServer(app);

// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:5173",
//     credentials: true
//   }
// }); 




const PORT = process.env.PORT || 5000;
const httpServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
initSocketHandlers(httpServer); 
