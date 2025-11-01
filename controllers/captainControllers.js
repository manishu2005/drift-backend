import captainModel from "../models/captainModel.js";
import { validationResult } from "express-validator";
import bcrypt from 'bcrypt'
import {blackListTokenModel} from '../models/blackListToken.js'


export const registerCaptain = async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
try{
 const {fullname, email, password, vehicle, role} = req.body;

    const isCaptainAlreadyExist = await captainModel.findOne({email});

    if (isCaptainAlreadyExist) {
        return res.status(400).json({message: 'captain already exist'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const captain = new captainModel({
        fullname,
        email,
        password: hashedPassword,
        vehicle,
        color,
        plate,
        capacity,
        vehicleType,
        role
    });

  const savedCaptain = await captain.save();
const token = savedCaptain.generateAuthToken();

const captainData = savedCaptain.toObject();
delete captainData.password;

res.status(201).json({
  success: true,
  message: "captain registered successfully",
  token,
  user: userWithoutPassword,
});
} catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const loginCaptain= async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
         const{ email, password} = req.body;
    const captain = await captainModel.findOne({email}).select('+password');

    if (!captain) {
        return res.status(401).json({message: 'Invalid email or password'});
    }

    const isMatch = await captain.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message: 'Invalid email or password'});
    }

    const token = captain.generateAuthToken();
     res.cookie('token', token);
    res.status(200).json({token,captain});
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

export const getCaptainProfile = async(req,res)=>{
    res.status(200).json({captain: req.captain})
}

export const logoutCaptain = async(req,res)=>{
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
     const { fullname, email, password, phone, role, vehicle } = req.body;

    if (!fullname?.firstname) {
      return res.status(400).json({message: "firstname is required"});
    }

    const captain = await captainModel.create({
      fullname,
      email,
      password,
      phone,
      role,
      vehicle,
    });

    res.status(201).json({
      success: true,
      message: "captain registered successfully",
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
