import express from 'express'
import { registerUser,loginUser } from '../controllers/userController.js'
import passport from 'passport'
import generateToken from '../utils/generateToken.js';
import { signup,login } from '../controllers/authController.js';
const redirectURL = process.env.NODE_ENV==='production'?'https://drift-your-rideing-partner.netlify.app/':'http://localhost:5173';
const router = express.Router();


router.post("/signup",signup);

// router.post("/login",loginUser);
router.post("/login",login);

router.get("/google", passport.authenticate("google",{scope:["profile","email"]}));

router.get("/google/callback",passport.authenticate("google",{failureRedirect:"/login"}),
(req,res)=>{
    const token = generateToken(req.user._id);
    res.redirect(
  `${redirectURL}/auth/success?token=${token}&name=${encodeURIComponent(
    req.user.name
  )}&email=${encodeURIComponent(req.user.email)}`);
}
);

export default router;
