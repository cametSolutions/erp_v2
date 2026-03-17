// controllers/userController.js
import User from "../Model/UserSchema.js";

export const createStaffUser = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { userName, email, mobileNumber, password, companyId } = req.body;

    if (!userName || !email || !mobileNumber || !password) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

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
      role: "staff",        // always staff
      owner: ownerId,       // primary admin is owner
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





// List all staff under current admin
export const listStaffUsers = async (req, res) => {
  try {
    const adminId = req.user.id; // logged-in primary user

    const users = await User.find({
      owner: adminId,     // match your field name
      role: "staff",      // only staff
    })
      .sort({ createdAt: -1 })
      .select("-password");

    return res.json(users);
  } catch (err) {
    console.error("listStaffUsers error:", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get single staff user
export const getStaffUserById = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const user = await User.findOne({
      _id: id,
      owner: adminId,
      role: "staff",
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateStaffUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { userName, email, mobileNumber, role, password } = req.body;

    // Find staff belonging to this admin
    const user = await User.findOne({
      _id: id,
      owner: adminId,
      role: "staff",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userName) user.userName = userName.trim();
    if (email) user.email = email.trim();
    if (mobileNumber) user.mobileNumber = mobileNumber.trim();
    if (role) user.role = role; // or drop this line if role must stay 'staff'

    // Only update password when a new one is provided;
    // pre('save') will hash it
    if (password && password.trim().length > 0) {
      user.password = password;
    }

    await user.save(); // triggers pre('save') and hashes password if modified

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ message: "User updated", user: userObj });
  } catch (err) {
    console.error("updateStaffUser error:", err);
    return res.status(500).json({ message: "Failed to update user" });
  }
};


export const deleteStaffUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const user = await User.findOneAndDelete({
      _id: id,
      owner: adminId,
      role: "staff",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};
