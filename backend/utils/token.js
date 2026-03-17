import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      owner: user.owner || null, // <‑‑ add this
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
