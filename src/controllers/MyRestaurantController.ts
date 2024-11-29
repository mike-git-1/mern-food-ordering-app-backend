import { Request, Response } from "express"
import Restaurant from "../models/restaurant"
import cloudinary from "cloudinary"
import mongoose from "mongoose"

// get current restaurant from db
const getMyRestaurant = async (req: Request, res: Response) => {
  try {
    // finds the 1st restaurant of the specified userId
    // userId obtained from middleware 'jwtParse'
    const restaurant = await Restaurant.findOne({ user: req.userId })

    // 1. check if the restaurant exists. If not, send a 404 status w/ json message indicating failure (to help debug)- and exit code.
    // ('return res.status(404).json({ message: "User not found" })' returns a Response object, which apparently causes TypeScript to flag this as an error since in Express,
    // route handlers are expected to have a return type of 'void' and not return any value
    // (separating the send() and return on their own line, which avoids confusion for TypeScript about the return type. Otherwise, it outputs an error...)
    if (!restaurant) {
      // send status code
      res.status(404).json({ message: "Restaurant not found" })
      // end the rquest
      return
    }

    // 3. return the restaurant to the calling client
    // converts data to json (note: json() behaves differently on server vs client-side. On server, it parses data into JSON, not a javascript obj)
    res.json(restaurant)

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching restaurant" })
  }
}

const createMyRestaurant = async (req: Request, res: Response) => {
  try {
    // checks if user already has an existing restaurant (can only create 1 restaurant per account)
    // search for restaurant using the logged in user. (userId obtained from middleware jwtParse)
    const existingRestaurant = await Restaurant.findOne({ user: req.userId })

    // if restaurant already exists, inform client and exit
    if (existingRestaurant) {
      // 409=record exists already
      res.status(409).json({ message: "User restaurant already exists" })
      // exit
      return
    }

    // using our custom fn to upload the image. Returns our cloudinary url after uploading
    // TypeScript syntax used to type cast req.file to a specific type (@types/multer)
    const imageUrl = await uploadImage(req.file as Express.Multer.File)

    // create new restaurant with the data
    const restaurant = new Restaurant(req.body)
    restaurant.imageUrl = imageUrl
    // link current logged in user to this restaurant
    // recall req.userId is returned as string from our middleware, so we convert it back to ObjectiD.
    restaurant.user = new mongoose.Types.ObjectId(req.userId)
    // set as current data
    restaurant.lastUpdate = new Date()

    // save to db
    await restaurant.save()

    // send restaurant to client as the response body
    // by default, send() converts object to JSON
    res.status(201).send(restaurant)

    // display generic error message
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Something went wrong" })
  }
}

const updateMyRestaurant = async (req: Request, res: Response) => {
  try {
    // search for restaurant using the logged in user. (userId obtained from middleware jwtParse)
    const restaurant = await Restaurant.findOne({ user: req.userId })

    // if restaurant doesnt exist, inform client and exit
    if (!restaurant) {
      // 404=record doesnt exist
      res.status(409).json({ message: "Restaurant not found" })
      // exit
      return
    }

    // update the restaurant model with the request body
    restaurant.restaurantName = req.body.restaurantName
    restaurant.city = req.body.city
    restaurant.country = req.body.country
    restaurant.deliveryPrice = req.body.deliveryPrice
    restaurant.estimatedDeliveryTime = req.body.estimatedDeliveryTime
    restaurant.cuisines = req.body.cuisines
    restaurant.menuItems = req.body.menuItems
    // set current timestamp
    restaurant.lastUpdate = new Date()

    // if user has uploaded an img (img is optional field)
    if (req.file) {
      // using our custom fn to upload the image. Returns our cloudinary url after uploading
      // TypeScript syntax used to type cast req.file to a specific type (@types/multer)
      const imageUrl = await uploadImage(req.file as Express.Multer.File)
      // update the restaurant with the new image
      restaurant.imageUrl = imageUrl
    }

    // save to db
    await restaurant.save()

    // send restaurant to client as the response body
    // by default, send() converts object to JSON
    res.status(200).send(restaurant)

    // display generic error message
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Something went wrong" })
  }
}

// function to encapsulate image upload logic
const uploadImage = async (file: Express.Multer.File) => {
  // get image from request. (image was attached to req obj from the multer middleware)
  const image = file
  // convert image from binary into base64 encoded string
  const base64Image = Buffer.from(image.buffer).toString("base64")
  // cloudianry requires dataURI for uploading
  // constructing data URI which follows this format: data:[<mediatype>][;base64],<data>
  // mimetype = file type (png,jpeg..)
  const dataURI = `data:${image.mimetype};base64,${base64Image}`

  // using cloudinary sdk to upload our image to cloudinary.
  // returns an API response that contains the cloudinary image url
  // if error occurs, it will throw an error which will be caught by our catch block
  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI)

  return uploadResponse.url
}
export default { createMyRestaurant, getMyRestaurant, updateMyRestaurant }
