import { Request, Response, NextFunction } from "express"
import { body, validationResult } from "express-validator"

export const handleValidationErrors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // method from express-validator that retrieves any errors accumlated  from the req obj
  const errors = validationResult(req)

  // if there are errors, repond with 400 status code and the list of errors
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return
  }
  // If no errors are found,  pass the request along to the next middleware or route handler.
  next()
}

// array of validation middlewares for all our requests
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
