// entry point to our server

// imports TypeScript types for Request and Response from express (@types/express)
import express, { Request, Response } from "express"
import cors from "cors"
import "dotenv/config"
import mongoose from "mongoose"
// recall this is the 'router'. The name 'myUserRoute' is arbitrary. You can name it whatever you want as long as you're importing the 'default export' from the file.
import myUserRoute from "./routes/MyUserRoute"
import myRestaurantRoute from "./routes/MyRestaurantRoute"
import { v2 as cloudinary } from "cloudinary"

// Typescript unsure if env variable can be undefined, so it returns an error
// We use TypeScript's 'as string' (casting) to ensure that TypeScript treats the environment variable as a string, even though it could be undefined.
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  // .connect returns a promise. If resolved, print to console that connection was successful
  .then(() => console.log("Connected to database"))

// initializes cloudinary with these credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const app = express() // create new express server

// middleware that automatically parses incoming JSON data from the request body, to a javascript object
app.use(express.json())
app.use(cors())

// BASIC endpoint to our server to check if the server has successfully started
// if you receive a response, then the server is healthy
app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health OK!" })
})

// any requests that start "/api/my/user" will be forwarded to 'myUserRoute' file (router), which will handle the request.
// in REST, the /my/ part of the path clearly indicates that this endpoint relates to the currently authenticated user
// and the request is specific to their data
app.use("/api/my/user", myUserRoute)

app.use("/api/my/restaurant", myRestaurantRoute)

app.listen(7000, () => {
  console.log("server started on localhost:7000")
})
