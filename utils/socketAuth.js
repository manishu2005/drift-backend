// utils/socketAuth.js
import jwt from "jsonwebtoken";
import User from "../models/userModels.js";

// Socket auth middleware: verifies JWT and loads the full user record
export default async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log(" No token found in socket handshake");
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support tokens that encode either { id } or { _id }
    const userId = decoded?.id || decoded?._id;
    if (!userId) {
      console.log(" Token did not contain user id");
      return next(new Error("Authentication error"));
    }

    // Load user from DB to get role, name, email etc.
    const user = await User.findById(userId).lean();
    if (!user) {
      console.log(" No user found for id from token");
      return next(new Error("Authentication error"));
    }

    // Attach a plain object with the minimal fields we need
    socket.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.fullname?.firstname ? `${user.fullname.firstname||''} ${user.fullname.lastname||''}`.trim() : undefined,
      email: user.email,
    };

    console.log(" Socket authenticated:", socket.user.id, socket.user.role);
    return next();
  } catch (err) {
    console.log(" Socket auth failed:", err.message);
    return next(new Error("Authentication error"));
  }
}
