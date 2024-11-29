import { Request, Response, NextFunction } from "express"
import { body, validationResult } from "express-validator"

export const handleValidationErrors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // method from express-validator that retrieves any errors accumlated  from the req obj
  const errors = validationResult(req)

  // if there are errors, repond with 400 status code and the list of errors accumlated
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  // If no errors are found,  pass the request along to the next middleware or route handler.
  next()
}

// array of validation middlewares for user data
// express processes each function in the array sequentially
// 1. When a request is made, this middleware runs and checks each field against the express-validators (body())
// 2. if a validator is invalid, it adds the error to the request object and proceeds to the next validator
// 3. handleValidationErrors then checks if any errors were accumulated on the req obj, if so, responds with an error. If not, proceed to the next handler.
export const validateMyUserRequest = [
  // check body of req for a 'name' field, is a string, not empty, with a custom error message
  body("name").isString().notEmpty().withMessage("Name must be a string"),
  body("addressLine1")
    .isString()
    .notEmpty()
    .withMessage("AddressLine1 must be a string"),
  body("city").isString().notEmpty().withMessage("City must be a string"),
  body("country").isString().notEmpty().withMessage("Country must be a string"),
  handleValidationErrors,
]

// array of validation middlewares for restaurant data
// no need to add validation for imageFile since multer handles that for us
export const validateMyRestaurantRequest = [
  body("restaurantName")
    .isString()
    .notEmpty()
    .withMessage("Restaurant name is required"),
  body("city").isString().notEmpty().withMessage("City is required"),
  body("country").isString().notEmpty().withMessage("Country is required"),
  body("deliveryPrice")
    .isFloat({ min: 0 })
    .withMessage("Delivery price must be a positive number"),
  body("estimatedDeliveryTime")
    .isInt({ min: 0 })
    .withMessage("Estimated delivery time must be a positive integer"),
  body("cuisines")
    .isArray()
    .withMessage("Cuisines must be an array")
    .notEmpty()
    .withMessage("Cuisines array cannot be empty"),
  body("menuItems").isArray().withMessage("Menu items must be an array"),
  // menuItem is an array of objects. So we add validation for the individual properties inside each object
  body("menuItems.*.name").notEmpty().withMessage("Menu item name is required"),
  body("menuItems.*.price")
    .isFloat({ min: 0 })
    .withMessage("Menu item price is required and must be a positive number"),
  handleValidationErrors,
]
