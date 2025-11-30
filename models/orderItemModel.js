import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    restaurantId: {
      type: String,
      required: true
    },
    status: { type: String, default: "In Process" }
  },
  {
    timestamps: true
  }
);

const orderItemModel =
  mongoose.models.orderItem || mongoose.model("orderItem", orderItemSchema);

export default orderItemModel;