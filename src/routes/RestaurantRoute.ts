import express from "express"
import { param } from "express-validator"
import RestaurantController from "../controllers/RestaurantController"

const router = express.Router()

// GET requests to "api/restaurant/:restaurantId" will be passed to 'getRestaurant' fn
router.get(
  "/:restaurantId",
  // param from express-validator
  // middleware for validating the "restaurantId" parameter is a string, not empty, removes leading/trailing spaces...with a custom error message
  // similiar to what we've done in validation.ts but since this just a single paramter, we can define it inline here.
  param("restaurantId")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("RestaurantId parameter must be a valid string"),
  RestaurantController.getRestaurant
)

// GET requests to "api/restaurant/search/:city" will be passed to 'searchRestaurant' fn
router.get(
  "/search/:city",
  // param from express-validator
  // middleware for validating the "city" parameter is a string, not empty, removes leading/trailing spaces...with a custom error message
  // similiar to what we've done in validation.ts but since this just a single paramter, we can define it inline here.
  param("city")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("City parameter must be a valid string"),
  RestaurantController.searchRestaurant
)

export default router
