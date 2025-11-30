import express from "express";
import { adminMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import { cancelOrder, getOrderById, getOrderByRestaurantId, listAllOrders, placeOrder, updateStatus, userOrders, verifyOrder } from "../controllers/orderController.js";

const orderRouter = express.Router();
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.get("/userorders/:id", authMiddleware, userOrders);
orderRouter.get('/list', listAllOrders);
orderRouter.post("/status", updateStatus);
orderRouter.post("/cancel/:id", cancelOrder);
orderRouter.get("/:id", authMiddleware, getOrderById);
orderRouter.get("/admin/restaurant/:id", getOrderByRestaurantId);

export default orderRouter; 