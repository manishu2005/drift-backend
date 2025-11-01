import express from 'express';
const router = express.Router();
import {body} from 'express-validator'
import { loginCaptain, logoutCaptain, registerCaptain } from '../controllers/captainControllers.js';
import { authCaptain } from '../middlewares/authMiddlewares.js';

router.post('/register',[
    body('email').isEmail().withMessage('Invalid Email'),
    body('fullname.firstname').isLength({min: 3}).withMessage('First name must be at least 3 charchter'),
    body('password').isLength({min: 6}).withMessage('password  must be at least 6 charchter'),
    body('vehicle.color').isLength({min: 3}).withMessage('color must be at least 3 charchter'),
    body('vehicle.plate').isLength({min: 3}).withMessage('plate must be at least 3 charchter'),
    body('vehicle.capacity').isInt({min: 1}).withMessage('capacity must be at least 1'),
    body('vehicle.vehicleType').isIn(['car','motorcycle','auto']).withMessage('First name must be at least 3 charchter'),

],
registerCaptain)


router.post('/login',[
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 charchter'),
], loginCaptain)


 router.get('/profile', authCaptain, (req, res) => {
        res.status(200).json({captain: req.captain})
 });

 router.get('/logout', authCaptain,logoutCaptain);
export default router;
