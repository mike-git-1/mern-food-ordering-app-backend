// In addition to AUTH0 database that stores our users, we create our own database for the users since its easier to work with
import mongoose from "mongoose"

// menuItems schema
// the reason we define a separate schema for menuitems is so that we can generate ids for the items which will be useful later for fetching menuitem data
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
})

// restaurant schema
const restaurantSchema = new mongoose.Schema({
  // store reference to the user document responsible for this restaurant
  // links restaurants to the user model
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  restaurantName: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  deliveryPrice: { type: Number, required: true },
  estimatedDeliveryTime: { type: Number, required: true },
  // array of strings
  cuisines: [{ type: String, required: true }],
  // array of menu item schemas
  menuItems: [menuItemSchema],
  // obtained from cloudinary
  imageUrl: { type: String, required: true },
  lastUpdate: { type: Date, required: true },
})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)
export default Restaurant
