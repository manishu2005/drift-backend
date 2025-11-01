import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const captainSchema = new mongoose.Schema({
    fullname:{
        firstname: {
            type: String,
            required: true,
            minlength:[3, 'Firstname must be at least 3 charcters long'],
        },
        lastname:{
            type: String,
        }
    },

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        
    },

    password:{
        type: String,
        required: true,
        select: false,
    },

    socketId: {
        type: String,
    },

    status:{
        type: String,
        enum:['active','inactive'],
        default: 'inactive',
    },
    vehicle:{
        color:{
            type: String,
            required: true,
            minlength: [3, 'Color must be at least 3 charcter long'],
        },
        plate:{
            type: String,
            required: true,
            minlength:[3, 'Plate must be at least 3 charcter long'],
        },
        capacity:{
            type: Number,
            required: true,
            min:[1, 'capacity must be at least 1'],
        },
        vehicleType:{
            type: String,
            required: true,
            enum:['car','motorcycle','auto'],
        },
        location:{
            Lat:{
                type: Number,
            },
            Long:{
                type: Number,
            }
        }

    },
     role: {
        type: String,
        enum: ["user", "captain"],
        default: "captain",
      },
})

captainSchema.methods.generateAuthToken = function(){
    const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: '24h'})

    return token;
}

captainSchema.pre('save',async function(next){
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password && !this.googleId && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})
// after saving the captain

captainSchema.methods.comparePassword= async function (password) {
    return await bcrypt.compare(password, this.password);
}

captainSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const captainModel = mongoose.model('Captain', captainSchema);

export default captainModel;
