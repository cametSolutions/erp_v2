// controllers/userController.js
import User from "../Model/UserSchema.js";

export const createStaffUser = async (req, res) => {
  try {
    // req.user is the logged-in admin (set by auth middleware)
    const ownerId = req.user.id;

    const { userName, email, mobileNumber, password, role, companyId } =
      req.body;

    if (!userName || !email || !mobileNumber || !password) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // ensure only admins can create staff
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create users" });
    }

    const existing = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Email or mobile already registered" });
    }

    const newUser = await User.create({
      userName: userName.trim(),
      email: email.trim(),
      mobileNumber: mobileNumber.trim(),
      password,
      role: role || "staff", // use "staff" by default
      owner: ownerId,
      company: companyId || null,
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: "User created successfully",
      user: userObj,
    });
  } catch (err) {
    console.error("createStaffUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
