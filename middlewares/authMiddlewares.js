import userModel from "../models/userModels.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { blackListTokenModel } from "../models/blackListToken.js";
import captainModel from "../models/captainModel.js";


export const authUser = async(req,res, next)=>{ 
    
    // Check if the Authorization header exists and split it.
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if(!token){
       
        return res.status(403).json({message: 'Access denied. No token provided.'}); 
    }

    const isBlacklisted = await blackListTokenModel.findOne({token: token});

    if (isBlacklisted) {
        return res.status(401).json({message: 'Unauthorized access'})
    }
    try{
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
       
        const user = await userModel.findById(decoded._id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: User not found.' });
        }

        
        req.user = user;

        
        next(); 
    }catch(err){
       
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({message: 'Unauthorized: Invalid token.'});
    }
}


export const authCaptain = async(req,res, next)=>{ 
    
    // Check if the Authorization header exists and split it.
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if(!token){
       
        return res.status(403).json({message: 'Access denied. No token provided.'}); 
    }

    const isBlacklisted = await blackListTokenModel.findOne({token: token});

    if (isBlacklisted) {
        return res.status(401).json({message: 'Unauthorized access'})
    }
    try{
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
       
        const captain = await captainModel.findById(decoded._id).select('-password');

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized: Captain not found.' });
        }

        
        req.captain = captain;

        
        next(); 
    }catch(err){
       
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({message: 'Unauthorized: Invalid token.'});
    }
}