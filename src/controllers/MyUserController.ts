// get the response and request 'types'
import { Request, Response } from "express"
import User from "../models/user"

// get current user from db
const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // finds the 1st user with the specified userId
    // userId obtained from middleware 'jwtParse'
    const currentUser = await User.findOne({ _id: req.userId })

    // 1. check if the current user exists. If not, send a 404 status w/ json message indicating failure (to help debug)- and exit code.
    // ('return res.status(404).json({ message: "User not found" })' returns a Response object, which apparently causes TypeScript to flag this as an error since in Express,
    // route handlers are expected to have a return type of 'void' and not return any value
    // (separating the send() and return on their own line, which avoids confusion for TypeScript about the return type. Otherwise, it outputs an error...)
    if (!currentUser) {
      // send status code
      res.status(404).json({ message: "User not found" })
      // end the rquest
      return
    }

    // 3. return the user to the calling client
    // converts data to json (note: json() behaves differently on server vs client-side. On server, it parses data into JSON, not a javascript obj)
    res.json(currentUser)

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error creating user" })
  }
}

// create a new uer to our db
const createCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.body obtained from front-end
    const { auth0Id } = req.body

    // finds the 1st user with the specified auth0Id
    // recall: { auth0Id } is shorthand for { auth0Id: auth0Id } (short-hand  syntax when key + value are the same).
    const existingUser = await User.findOne({ auth0Id })

    // 1. check if the user exists. If so, send a 200 status indicating success - and exit code.
    // ('return res.status(200).send()' returns a Response object, which apparently causes TypeScript to flag this as an error since in Express,
    // route handlers are expected to have a return type of 'void' and not return any value
    // (separating the send() and return on their own line, which avoids confusion for TypeScript about the return type. Otherwise, it outputs an error...)
    if (existingUser) {
      // send status code
      res.status(200).send()
      // end the rquest
      return
    }

    // 2. otherwise, create the user if it doesnt exist and save to our db
    const newUser = new User(req.body)
    await newUser.save()

    // 3. return the user obj to the calling client
    // 201 code means resource has been created on server
    // converts data to json (note: json() behaves differently on server vs client-side. On server, it parses data into JSON, not a javascript obj)
    res.status(201).json(newUser.toObject())

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error creating user" })
  }
}

// update use profile
const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    // get form data
    const { name, addressLine1, country, city } = req.body
    // get the user. userId obtained from middleware 'jwtParse'
    // userId preferred over auth0Id since we'll be fetching related documents to a given user which references the mongo userId.
    // findById takes a single id, not an object like findOne
    const user = await User.findById(req.userId)

    // if user not found - does not exist - send a generic message to client
    if (!user) {
      res.status(404).json({ message: "User not found" })
      // end the rquest
      return
    }

    // save updated user to our db
    user.name = name
    user.addressLine1 = addressLine1
    user.country = country
    user.city = city
    await user.save()

    // complete the request. return the user obj to the calling client
    res.send(user)

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Error updating user" })
  }
}
export default { getCurrentUser, createCurrentUser, updateCurrentUser }
