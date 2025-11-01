import mongoose from "mongoose";

 const blackListTokenSchema = new mongoose.Schema({
    token:{
        type: String,
        required: true,
        unique: true
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 86400
    }
})

export const blackListTokenModel = mongoose.model('BlackListToken', blackListTokenSchema);