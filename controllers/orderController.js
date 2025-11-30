import Stripe from "stripe";
import dotenv from 'dotenv';
import axios from "axios";
import orderItemRepository from "../repositories/orderItemRepository.js";
import orderRepository from "../repositories/orderRepository.js";
dotenv.config()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const user_service_url = process.env.USER_SERVICE_URL;

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:3000"; // Change this to your frontend URL
  try {
    const { userId, items, amount, address } = req.body;
    const newOrder = await orderRepository.create({ userId, amount, address });

    items.forEach(item => {
      item.orderId = newOrder._id;
    });
    const createdItems = await orderItemRepository.createMany(items);
    if (createdItems) {
      const itemIds = createdItems.map(item => item._id);
      await orderRepository.updateById(newOrder._id, { items: itemIds })
      await axios.put(`${user_service_url}/update/${req.body.userId}`, { cartData: {} }, {
        headers: {
          token: req.headers.token
        }
      })
    }

    // Create customer with name and address
    const customer = await stripe.customers.create({
      name: req.body.customerName, // Customer's name
      address: {
        line1: req.body.address.line1,
        city: req.body.address.city,
        state: req.body.address.state,
        postal_code: req.body.address.postal_code,
        country: req.body.address.country, // Ensure this is valid
      },
    });

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100, // Convert to paise
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 10000, // Delivery charges in paise (100 INR)
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id, // Link the customer to the session
      line_items: line_items,
      mode: "payment",
      billing_address_collection: 'required', // Require billing address
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error while placing order" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      await orderRepository.updateById(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderRepository.deleteById(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: `Error verifying order: ${error.message} ` });
  }
};

// user order for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderRepository.findByUserId(req.params.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: `Error getting user orders: ${error.message}` });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (order == null) {
      return res.json({ success: false, message: "order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.json({ success: false, message: `Error getting order: ${error.message}` });
  }
};

// list orders for admin panel
const listAllOrders = async (req, res) => {
  try {
    const orders = await orderRepository.findAll();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: `Error listing all orders: ${error.message}` });
  }
};

// api for updating order status
const updateStatus = async (req, res) => {
  try {
    await orderRepository.updateStatus(req.body.orderId, req.body.status);
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: `Error updating status: ${error.message}` });
  }
};

const cancelOrder = async (req, res) => {
  try {
    await orderRepository.updateStatus(req.params.id, { cancelled: true });
    res.json({ success: true, message: "order cancelled" });
  } catch (error) {
    res.json({ success: false, message: `Error cancelling order: ${error.message}` });
  }
};

const getOrderByRestaurantId = async (req, res) => {
  try {
    const orders = await orderItemRepository.findByRestaurantId(req.params.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: `Error getting restaurant orders: ${error.message}` });
  }
};

export {
  placeOrder,
  verifyOrder,
  userOrders,
  listAllOrders,
  updateStatus,
  getOrderById,
  cancelOrder,
  getOrderByRestaurantId
};
