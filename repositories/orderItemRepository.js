import orderItemModel from "../models/orderItemModel.js";

class OrderItemRepository {
    // Create a new order item
    async create(orderItemData) {
        try {
            const orderItem = new orderItemModel(orderItemData);
            return await orderItem.save();
        } catch (error) {
            throw new Error(`Error creating order item: ${error.message}`);
        }
    }

    // Create multiple order items
    async createMany(orderItemsArray) {
        try {
            return await orderItemModel.insertMany(orderItemsArray);
        } catch (error) {
            throw new Error(`Error creating order items: ${error.message}`);
        }
    }

    // Find order item by ID
    async findById(id) {
        try {
            return await orderItemModel.findById(id);
        } catch (error) {
            throw new Error(`Error finding order item: ${error.message}`);
        }
    }

    // Find all order items for a specific order
    async findByOrderId(orderId) {
        try {
            return await orderItemModel.find({ orderId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error finding order items by order ID: ${error.message}`);
        }
    }

    // Find all order items for a specific restaurant
    async findByRestaurantId(restaurantId) {
        try {
            return await orderItemModel.find({ restaurantId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error finding order items by restaurant ID: ${error.message}`);
        }
    }

    // Find all order items
    async findAll(filter = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
            const skip = (page - 1) * limit;

            const items = await orderItemModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await orderItemModel.countDocuments(filter);

            return {
                items,
                total,
                page,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Error finding order items: ${error.message}`);
        }
    }

    // Update order item by ID
    async updateById(id, updateData) {
        try {
            return await orderItemModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error updating order item: ${error.message}`);
        }
    }

    // Update multiple order items for an order
    async updateByOrderId(orderId, updateData) {
        try {
            return await orderItemModel.updateMany(
                { orderId },
                updateData,
                { runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error updating order items: ${error.message}`);
        }
    }

    // Delete order item by ID
    async deleteById(id) {
        try {
            return await orderItemModel.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting order item: ${error.message}`);
        }
    }

    // Delete all order items for a specific order
    async deleteByOrderId(orderId) {
        try {
            return await orderItemModel.deleteMany({ orderId });
        } catch (error) {
            throw new Error(`Error deleting order items by order ID: ${error.message}`);
        }
    }

    // Get total quantity for a specific item across all orders
    async getTotalQuantityByItemId(itemId) {
        try {
            const result = await orderItemModel.aggregate([
                { $match: { itemId } },
                { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
            ]);
            return result.length > 0 ? result[0].totalQuantity : 0;
        } catch (error) {
            throw new Error(`Error calculating total quantity: ${error.message}`);
        }
    }

    // Get total revenue by restaurant
    async getRevenueByRestaurant(restaurantId, startDate = null, endDate = null) {
        try {
            const matchStage = { restaurantId };
            if (startDate || endDate) {
                matchStage.createdAt = {};
                if (startDate) matchStage.createdAt.$gte = new Date(startDate);
                if (endDate) matchStage.createdAt.$lte = new Date(endDate);
            }

            const result = await orderItemModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
                        totalItems: { $sum: "$quantity" }
                    }
                }
            ]);

            return result.length > 0 ? result[0] : { totalRevenue: 0, totalItems: 0 };
        } catch (error) {
            throw new Error(`Error calculating revenue: ${error.message}`);
        }
    }
}

export default new OrderItemRepository();