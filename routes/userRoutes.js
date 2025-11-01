import express from "express";
const router = express.Router();
import {body} from 'express-validator'
import {registerUser,loginUser, logoutUser} from "../controllers/userController.js";
import { authUser } from "../middlewares/authMiddlewares.js";
//route for user registration
router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('fullname.firstname').isLength({min: 3}).withMessage('First name must be at least 3 character long'),
    body('password').isLength({min: 6}).withMessage('password must be at least 6 character long'),
],
registerUser)

//route for user login
router.post('/login',[
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({min : 6}).withMessage('password must be correct ')
],
 loginUser)

 router.get('/profile', authUser, (req, res) => {
    res.status(200).json(req.user);
 });

 router.get('/logout', authUser,logoutUser);



export default router;