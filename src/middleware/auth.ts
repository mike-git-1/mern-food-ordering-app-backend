import { auth } from "express-oauth2-jwt-bearer"
import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User from "../models/user"

// global declarations
declare global {
  // lets you access and modify the request types inside express
  namespace Express {
    interface Request {
      userId: string
      auth0Id: string
    }
  }
}

// middleware fn that will check each request's authrization header for the bearer token.
// verify that the token that we get in the reqeust came from the auth0 server and belogns to the user
export const jwtCheck = auth({
  // name of api we setup
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
})

// middleware used to obtain the auth0 ID from the current logged in users' auth token
// this auth0Id will be used to find the user in our mongodb
export const jwtParse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // grab the authorization property from the req header
  const { authorization } = req.headers

  // checks if authorization property exists and if it does, starts with "bearer",
  // e.g. checking if this user is authorized
  // if not, send unauthorized status code error
  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.sendStatus(401)
    return
  }

  // if user is authorized, get the token from the authorization string
  // splits the string at the 'space' in an array: 'Bearer 18asjfhsadiufhasf98fd'
  // we want specifically the second item (e.g. @index=1)
  const token = authorization.split(" ")[1]

  try {
    // using jsonwebtoken package to decode/parse our token. And casting w/ typscript 9@types/jsonwebtoken
    // returns jwt paylod obj
    const decoded = jwt.decode(token) as jwt.JwtPayload
    // extracting the 'sub' property from payload which represents the auth id
    const auth0Id = decoded.sub

    // find the user in our db
    const user = await User.findOne({ auth0Id })

    // if user not found - does not exist - send a generic 401 message to client
    if (!user) {
      res.sendStatus(401)
      return
    }

    // appending the ids to the request obj, which will be passed on to the next() route handler to use
    // (whenever you add custom properties to request obj, you need to let typescript know what their types are by extending the request interface (above))
    req.auth0Id = auth0Id as string // tells typescript we are sure this obj will be a string and not undefined
    req.userId = user._id.toString()

    next()

    // send back generic error message
  } catch (error) {
    res.sendStatus(401)
    return
  }
}
