import mongoose from "mongoose";
import { type } from "os";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    fullname:{
        firstname:{
            type: String,
            required: true,
            minLength: [3, 'First name must be at least 3 character'],
        },
        lastname:{
            type: String,
           
        }
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        select: false,
    },

    socketId: {
        type: String,
    },

    phone:{
        type: String,
        unique: true,
        sparse: true,
    },
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    role: {
    type: String,
    enum: ["user", "captain"],
    default: "user",
  },
});

userSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({_id: this._id},process.env.JWT_SECRET, {expiresIn: '24h'})
    return token;
}

userSchema.pre('save',async function(next){
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password && !this.googleId && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})
// after saving the user

userSchema.methods.comparePassword= async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('user', userSchema);

export default userModel;
