import mongoose from "mongoose"

// order schema
const orderSchema = new mongoose.Schema({
  // store reference to the Restaurant document responsible for this order
  // links restaurants to the order model
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  // linking user document to the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveryDetails: {
    email: { type: String, required: true },
    name: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
  },
  cartItems: [
    {
      menuItemId: { type: String, required: true },
      quantity: { type: Number, required: true },
      name: { type: String, required: true },
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    enum: ["placed", "paid", "inProgress", "outForDelivery", "delivered"],
  },
  createdAt: { type: Date, default: Date.now },
})

const Order = mongoose.model("Order", orderSchema)
export default Order
