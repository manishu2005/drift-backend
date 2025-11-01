import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: String,
  pickup: {
    address: String,
    lat: Number,
    lng: Number,
  },
  destination: {
    address: String,
    lat: Number,
    lng: Number,
  },

  status: { type: String, default: "requested" },
  assignedCaptainId: { type: mongoose.Schema.Types.ObjectId, ref: "Captain" },
}, { timestamps: true });

export default mongoose.model("Ride", rideSchema);
