import express from "express"
import MyRestaurantController from "../controllers/MyRestaurantController"
import { jwtCheck, jwtParse } from "../middleware/auth"
import { validateMyRestaurantRequest } from "../middleware/validation"
import multer from "multer"

const router = express.Router()
//  stores uploaded files in memory
const storage = multer.memoryStorage()
// how to handle images in our requests, max 5mb
const upload = multer({
  storage: storage,
  limits: {
    // 5MB
    fileSize: 5 * 1024 * 1024,
  },
})

// GET requests to "/api/my/restaurant" will be passed to 'getMyRestaurant' fn
router.get(
  "/",
  // checks if user is authorized (checks access token)
  jwtCheck,
  // extracts/parses user id from this access token
  jwtParse,
  MyRestaurantController.getMyRestaurant
)

// POST requests to "/api/my/restaurant" will be passed to 'createMyRestaurant' fn
router.post(
  "/",
  // middleware that checks req.body for a property called 'imageFile' (the name of the form field holding the data).
  // checks validations (<5mb), and stores in memory
  // and then adds the file as an object to the req and forwaded on
  upload.single("imageFile"),
  // validate data
  validateMyRestaurantRequest,
  // checks if user is authorized (checks access token)
  jwtCheck,
  // extracts/parses user id from this access token
  jwtParse,
  MyRestaurantController.createMyRestaurant
)

// PUT requests to "/api/my/restaurant" will be passed to 'updateMyRestaurant' fn
router.put(
  "/",
  // middleware that checks req.body for a property called 'imageFile' (the name of the form field holding the data).
  // checks validations (<5mb), and stores in memory
  // and then adds the file as an object to the req and forwaded on
  upload.single("imageFile"),
  // validate data
  validateMyRestaurantRequest,
  // checks if user is authorized (checks access token)
  jwtCheck,
  // extracts/parses user id from this access token
  jwtParse,
  MyRestaurantController.updateMyRestaurant
)
export default router
