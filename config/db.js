import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config(); // Ensure this is at the very top
const MONGO_URI = process.env.MONGO_URI;
export const connectDB = async () => {
    await mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected"))
}