import mongoose from "mongoose";

const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDb connect")
    }catch(error){
        console.log("MonogoDb connection Failed", error.message);
    }
};

export default connectDb;