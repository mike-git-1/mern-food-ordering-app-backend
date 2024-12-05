import mongoose, { InferSchemaType } from "mongoose"

// menuItems schema
// the reason we define a separate schema for menuitems is so that we can access ids for the items which will be useful later for fetching menuitem data
// By default, MongoDB generates an _id field for each document, which is of type ObjectId. But If you explicitly define it, you override it, so we provide it with
// The default function which will create a new ObjectId
const menuItemSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    rquired: true,
    default: () => new mongoose.Types.ObjectId(),
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
})

// menuItemType will be based/inferred from the schema
// export this so that we can reference this type when we work with menuitems in our orderController.ts
export type MenuItemType = InferSchemaType<typeof menuItemSchema>

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
