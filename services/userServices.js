
import userModel from "../models/userMdels.js";

const createUser = async (userData) => {
  const user = new userModel(userData);
  await user.save();
  return user;
};

export default { createUser };

