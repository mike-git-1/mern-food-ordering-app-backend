import { Request, Response } from "express"
import Stripe from "stripe"
import Restaurant, { MenuItemType } from "../models/restaurant"
import Order from "../models/order"

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string)
const FRONTEND_URL = process.env.FRONTEND_URL as string
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string

// For getting list of orders for the logged in user
const getMyOrders = async (req: Request, res: Response) => {
  try {
    // finds all the orders of the specified userId
    // userId obtained from middleware 'jwtParse'
    const orders = await Order.find({ user: req.userId })
      // replace/populate the references with the actual restaurant and user documents
      .populate("restaurant")
      .populate("user")

    res.json(orders)

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error fetching orders" })
  }
}

// what we expect to get from the front end, an object. define the types of the req.body
type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string
    name: string
    quantity: string
  }[] // indicates that cartItems that we received from req.body is going to be in an array
  deliveryDetails: {
    email: string
    name: string
    addressLine1: string
    city: string
  }
  restaurantId: string
}

// handles the webhook event sent from STRIPE
const stripeWebhookHandler = async (req: Request, res: Response) => {
  // constructEvent function below from the Stripe SDK already ensures the correct type is inferred based on the event that Stripe sends, no need to explicity define the type
  let event
  try {
    // get the value of the stripe-signature key from the request header
    const sig = req.headers["stripe-signature"]
    // will use our endpoint secret to verify that this signature was legitimately from Stripe.
    // if verified, stripe will construct the event and give it to us in this event obj
    event = STRIPE.webhooks.constructEvent(
      req.body,
      sig as string,
      STRIPE_ENDPOINT_SECRET
    )

    // if Stripe throws an error, it will provide us a descriptive message under error
    // typescript complains stripe error has no type. give type of :any
  } catch (error: any) {
    console.log(error)
    res.status(400).json(`Webhook error: ${error.message}`)
    return
  }

  // stripe will send a bunch of events to us, we are only interested in "checkout.session.completed"
  if (event.type === "checkout.session.completed") {
    // recall when we created the checkout session, we attached the orderid to the metadata field. Using this id to find the order
    const order = await Order.findById(event.data.object.metadata?.orderId)

    if (!order) {
      res.status(404).json({ message: "Order not found" })
      return
    }

    // updating our model with the data from the event
    order.totalAmount = event.data.object.amount_total
    order.status = "paid"
    await order.save()
  }
  // akwnoeldge to stripe that we've received and handled this webhook successfully
  res.status(200).send()
}

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // get the checkout request from req.body
    const checkoutSessionRequest: CheckoutSessionRequest = req.body

    // finds the specific restaurant by id
    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    )

    // if restaurant not found for some reason, throw an error which will be caught by our catch block
    if (!restaurant) {
      throw new Error("Restaurant not found")
    }

    // create the order instance model to save to db
    const newOrder = new Order({
      restaurant: restaurant,
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createdAt: new Date(),
    })

    // stripe requirEs we format our items a certain way so that it can display them properly in their UI
    const lineItems = createLineItems(
      checkoutSessionRequest,
      restaurant.menuItems
    )

    // SEND DATA off to stripe to create the checkout page
    const session = await createSession(
      lineItems,
      newOrder._id.toString(),
      restaurant.deliveryPrice,
      restaurant._id.toString()
    )

    // if we dont get the url of hosted page on stripe
    if (!session.url) {
      res.status(500).json({ message: "Error creating stripe session" })
      return
    }

    // save the order to our db
    await newOrder.save()

    // send url to front end
    res.json({ url: session.url })

    // if Stripe throws an error, it will provide us a descriptive message under raw.message
    // typescript complains stripe error has no type. give type of :any
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ message: error.raw.message })
  }
}

// 1. for each cartItem, get the menuItem obj from the restaurant (to get the price)
//    the reason why we dont include the price in checkoutSessionRequest is because ppl can use postman to modify the price with this open API!
// 2. for each cartItem, convert it to a stripe line item
// 3. return line item array
const createLineItems = (
  checkoutSessionRequest: CheckoutSessionRequest,
  menuItems: MenuItemType[]
) => {
  const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
    // 1. for each cartItem, get the corresponding menuItem obj from the restaurant (to get the price)
    const menuItem = menuItems.find(
      (item) => item._id.toString() === cartItem.menuItemId.toString()
    )

    // unlikely, but still check
    if (!menuItem) {
      throw new Error(`Menu item not found: ${cartItem.menuItemId}`)
    }

    // 2. for each cartItem, convert it to a stripe line item
    // line_item of type: Stripe.Checkout...(from stripe sdk)
    // this is the specific strucuture stripe requires our data to be formatted in
    const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: "cad",
        unit_amount: menuItem.price,
        product_data: {
          name: menuItem.name,
        },
      },
      quantity: parseInt(cartItem.quantity),
    }
    return line_item
  })

  // 3. return line item array
  return lineItems
}

const createSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  orderId: string,
  deliveryPrice: number,
  restaurantId: string
) => {
  // API call that creates the session
  // session object represents a Stripe Checkout session where the user can complete the payment.
  const sessionData = await STRIPE.checkout.sessions.create({
    line_items: lineItems,
    // defines the delivery price and how it is calculated
    shipping_options: [
      {
        shipping_rate_data: {
          display_name: "Delivery",
          type: "fixed_amount",
          fixed_amount: {
            amount: deliveryPrice,
            currency: "cad",
          },
        },
      },
    ],
    mode: "payment",
    // store additional custom data with the session
    metadata: {
      orderId,
      restaurantId,
    },
    // if success or cancelled, send them back to our frontend
    success_url: `${FRONTEND_URL}/order-status?success=true`,
    cancel_url: `${FRONTEND_URL}/detail/${restaurantId}?cancelled=true`,
  })
  return sessionData
}

export default { createCheckoutSession, stripeWebhookHandler, getMyOrders }
