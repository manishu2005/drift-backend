import userModel from "../models/userModels.js";
import captainModel from "../models/captainModel.js";
import bcrypt from "bcrypt";

export const signup = async (req, res) => {
  try {
    const { fullname, email, password, phone, role, vehicle } = req.body;

    let existing =
      (role === "captain"
        ? await captainModel.findOne({ email })
        : await userModel.findOne({ email }));

    if (existing) {
      return res.status(400).json({ message: `${role} already exists` });
    }

    let newUser;
    if (role === "captain") {
      newUser = new captainModel({
        fullname,
        email,
        password,
        phone,
        vehicle,
        role: "captain",
      });
    } else {
      newUser = new userModel({
        fullname,
        email,
        password,
        phone,
        role: "user",
      });
    }

    await newUser.save();

    const token = newUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(" Login request received:", email, password);

    let existingUser = await userModel.findOne({ email }).select("+password");
    let role = "user";

    if (!existingUser) {
      existingUser = await captainModel.findOne({ email }).select("+password");
      role = "captain";
    }

    if (!existingUser) {
      console.log(" No user or captain found for email:", email);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(" Found user:", existingUser.email, "role:", role);

    const isMatch = await bcrypt.compare(password, existingUser.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log(" Invalid password for:", email);
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = existingUser.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: existingUser._id,
        fullname: existingUser.fullname,
        email: existingUser.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
