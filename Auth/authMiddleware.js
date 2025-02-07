import jwt from 'jsonwebtoken';
import User from '../modules/user.module.js'

// Middleware to verify token
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin or superadmin
export const verifyAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    console.log(user.role);
    if (!user || ( user.role !== 'superadmin')) {
      return res.status(403).json({ message: 'Access denied, Superadmin only' });
    }
    next();
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Auth Server error', error: error.message });
  }
};
