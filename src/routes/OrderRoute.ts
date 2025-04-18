import express from "express"
import { jwtCheck, jwtParse } from "../middleware/auth"
import OrderController from "../controllers/OrderController"

const router = express.Router()

// GET requests to "api/order" . For getting list of orders for the logged in user
router.get(
  "/",
  // checks if user is authorized (checks access token)
  jwtCheck,
  // extracts/parses user id from this access token
  jwtParse,
  OrderController.getMyOrders
)

// POST requests to stripe endpoint "api/order/checkout/create-checkout-session" will be passed to 'createCheckoutSession' fn
router.post(
  "/checkout/create-checkout-session",
  // checks if user is authorized (checks access token)
  jwtCheck,
  // extracts/parses user id from this access token
  jwtParse,
  OrderController.createCheckoutSession
)

// POST requests to "api/order/checkout/webhook"
router.post("/checkout/webhook", OrderController.stripeWebhookHandler)
export default router
