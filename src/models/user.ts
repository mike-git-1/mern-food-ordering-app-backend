// In addition to AUTH0 database that stores our users, we create our own database for the users since its easier to work with
import mongoose from "mongoose"

// user account schema
const userSchema = new mongoose.Schema({
  // store id of user thats stored in auth0 database
  // good idea to store auth0Id so we can link auth0Id and our own mongo _id together
  auth0Id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  // profile settings:
  name: {
    type: String,
  },
  addressLine1: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
})

const User = mongoose.model("User", userSchema)
export default User
