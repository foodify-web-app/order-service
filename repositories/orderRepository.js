import orderModel from "../models/orderModel.js";
import orderItemRepository from "./orderItemRepository.js";

class OrderRepository {
    // Create a new order
    async create(orderData) {
        try {
            const order = new orderModel(orderData);
            return await order.save();
        } catch (error) {
            throw new Error(`Error creating order: ${error.message}`);
        }
    }

    // Find order by ID
    async findById(id) {
        try {
            return await orderModel.findById(id);
        } catch (error) {
            throw new Error(`Error finding order: ${error.message}`);
        }
    }

    // Find all orders for a specific user
    async findByUserId(userId, options = {}) {
        try {
            const { page = 1, limit = 10, sort = { date: -1 } } = options;
            const skip = (page - 1) * limit;

            const orders = await orderModel
                .find({ userId })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("items");

            const total = await orderModel.countDocuments({ userId });

            return {
                orders,
                total,
                page,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Error finding orders by user ID: ${error.message}`);
        }
    }

    // Find all orders
    async findAll(filter = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = { date: -1 } } = options;
            const skip = (page - 1) * limit;

            const orders = await orderModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await orderModel.countDocuments(filter);

            return {
                orders,
                total,
                page,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Error finding orders: ${error.message}`);
        }
    }

    // Find orders by status
    async findByStatus(status, options = {}) {
        try {
            return await this.findAll({ status }, options);
        } catch (error) {
            throw new Error(`Error finding orders by status: ${error.message}`);
        }
    }

    // Find pending orders (not cancelled and not paid)
    async findPending(options = {}) {
        try {
            return await this.findAll(
                { cancelled: false, payment: false },
                options
            );
        } catch (error) {
            throw new Error(`Error finding pending orders: ${error.message}`);
        }
    }

    // Find completed orders (paid and not cancelled)
    async findCompleted(options = {}) {
        try {
            return await this.findAll(
                { cancelled: false, payment: true },
                options
            );
        } catch (error) {
            throw new Error(`Error finding completed orders: ${error.message}`);
        }
    }

    // Find cancelled orders
    async findCancelled(options = {}) {
        try {
            return await this.findAll({ cancelled: true }, options);
        } catch (error) {
            throw new Error(`Error finding cancelled orders: ${error.message}`);
        }
    }

    // Update order by ID
    async updateById(id, updateData) {
        try {
            return await orderModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error updating order: ${error.message}`);
        }
    }

    // Update order status
    async updateStatus(id, status) {
        try {
            return await this.updateById(id, { status });
        } catch (error) {
            throw new Error(`Error updating order status: ${error.message}`);
        }
    }

    // Mark order as paid
    async markAsPaid(id) {
        try {
            return await this.updateById(id, { payment: true });
        } catch (error) {
            throw new Error(`Error marking order as paid: ${error.message}`);
        }
    }

    // Cancel order
    async cancelOrder(id) {
        try {
            return await this.updateById(id, { cancelled: true });
        } catch (error) {
            throw new Error(`Error cancelling order: ${error.message}`);
        }
    }

    // Delete order by ID
    async deleteById(id) {
        try {
            await orderItemRepository.deleteByOrderId(id);
            return await orderModel.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }

    // Get orders within date range
    async findByDateRange(startDate, endDate, options = {}) {
        try {
            const filter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
            return await this.findAll(filter, options);
        } catch (error) {
            throw new Error(`Error finding orders by date range: ${error.message}`);
        }
    }

    // Get user's order history
    async getUserOrderHistory(userId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;

            const orders = await orderModel
                .find({ userId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit);

            const total = await orderModel.countDocuments({ userId });
            const completed = await orderModel.countDocuments({ userId, payment: true, cancelled: false });
            const cancelled = await orderModel.countDocuments({ userId, cancelled: true });
            const pending = await orderModel.countDocuments({ userId, payment: false, cancelled: false });

            return {
                orders,
                total,
                completed,
                cancelled,
                pending,
                page,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Error getting user order history: ${error.message}`);
        }
    }

    // Get total revenue
    async getTotalRevenue(filter = {}) {
        try {
            const matchStage = { payment: true, cancelled: false, ...filter };

            const result = await orderModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]);

            return result.length > 0 ? result[0] : { totalRevenue: 0, totalOrders: 0 };
        } catch (error) {
            throw new Error(`Error calculating total revenue: ${error.message}`);
        }
    }

    // Get revenue by date range
    async getRevenueByDateRange(startDate, endDate) {
        try {
            const filter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
            return await this.getTotalRevenue(filter);
        } catch (error) {
            throw new Error(`Error calculating revenue by date range: ${error.message}`);
        }
    }

    // Get orders statistics
    async getStatistics() {
        try {
            const total = await orderModel.countDocuments();
            const completed = await orderModel.countDocuments({ payment: true, cancelled: false });
            const cancelled = await orderModel.countDocuments({ cancelled: true });
            const pending = await orderModel.countDocuments({ payment: false, cancelled: false });
            const inProcess = await orderModel.countDocuments({ status: "In Process" });

            const revenue = await this.getTotalRevenue();

            return {
                total,
                completed,
                cancelled,
                pending,
                inProcess,
                totalRevenue: revenue.totalRevenue
            };
        } catch (error) {
            throw new Error(`Error getting order statistics: ${error.message}`);
        }
    }

    // Count orders by user
    async countByUserId(userId) {
        try {
            return await orderModel.countDocuments({ userId });
        } catch (error) {
            throw new Error(`Error counting orders by user: ${error.message}`);
        }
    }
}

export default new OrderRepository();