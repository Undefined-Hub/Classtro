const bcrypt = require("bcrypt");
const z = require("zod");
const dotenv = require('dotenv');


const User = require('../models/User'); 
const { validateInput } = require("../utils/validateInput");
const { generateToken } = require("../utils/jwtHelper");

// Load environment variables
dotenv.config();

// Zod schemas
const userRegisterSchema = z.object({
    name: z.string().min(3, "Name must contain at least 3 characters"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    role: z.enum(["Employee", "Manager"], "Role must be either 'Employee' or 'Manager'"),
});

const userLoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
});

// Register a new user
const registerUser = async (req, res, next) => {
    try {
        // Validate input
        const { name, email, phone, password, role } = validateInput(userRegisterSchema, req.body);

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password and save user
        const hashed_password = await bcrypt.hash(password, 10);
        const user = new User({ name, email, phone, password: hashed_password, role });
        await user.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        next(error);
    }
};

// Login a user
const loginUser = async (req, res, next) => {
    try {
        // Validate input
        const { email, password } = validateInput(userLoginSchema, req.body);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken({ _id: user._id , role:user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Logged in successfully", token });
    } catch (error) {
        next(error);
    }
};

module.exports = { registerUser, loginUser };
