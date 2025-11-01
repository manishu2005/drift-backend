import userModel from "../models/userModels.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import {blackListTokenModel} from '../models/blackListToken.js'

export const registerUser = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullname, email, password,phone ,role} = req.body;

 
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

       const hashedPassword = await userModel.hashPassword(password);

const user = new userModel({
    fullname,
    email,
    password: hashedPassword,
    phone,
    role, 
});

const savedUser = await user.save();
const token = savedUser.generateAuthToken();

const userWithoutPassword = savedUser.toObject();
delete userWithoutPassword.password;

res.status(201).json({
  success: true,
  message: "user registered successfully",
  token,
  user: userWithoutPassword,
});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

}

export const loginUser = async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateAuthToken();
    
    res.cookie('token', token);
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getUserProfile = async(req,res)=>{
  
}
export const logoutUser = async(req,res)=>{
    // Clear the client-side cookie immediately
    res.clearCookie('token');
    
    let token;
    
    // Check Authorization header first (Bearer Token)
    if (req.headers.authorization && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; 
    } 
   
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (token) {
        try {
            await blackListTokenModel.create({ token });
        } catch (error) {
            console.error("Failed to blacklist token:", error);
            
        }
    }
    
    res.status(200).json({message: 'Logged out successfully'});
}

export const signup = async(req,res)=>{
  try{
    console.log("incoming signup data", req.body);
     const { fullname, email, password, phone, role } = req.body;

    if (!fullname?.firstname) {
      return res.status(400).json({message: "firstname is required"});
    }

    const user = await userModel.create({
      fullname,
      email,
      password,
      phone,
      role
    });

    res.status(201).json({
      success: true,
      message: "user registered successfully",
      data: user,
    });
  }catch(error){
   console.error("Signup error:", error);
  res.status(500).json({
    success: false,
    message:
      error.message ||
      (error.errors && Object.values(error.errors).map((err) => err.message)) ||
      "Internal Server Error",
  });
  }
};
