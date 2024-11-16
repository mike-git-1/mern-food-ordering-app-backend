import express from "express"
import MyUserController from "../controllers/MyUserController"
import { jwtCheck, jwtParse } from "../middleware/auth"
import { validateMyUserRequest } from "../middleware/validation"

const router = express.Router()

// for getting current logged in user  (e.g. to pre-populate form with user data)
// checks if user is authorized (checks access token)
// extracts/parses user id from this access token
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser)

// requests to "/api/my/user" will be passed to 'createCurrentUser' fn
// jwtCheck to check if user is authorized (checks token)
router.post("/", jwtCheck, MyUserController.createCurrentUser)

// for updating user profile
// checks if user is authorized (checks access token)
// extracts/parses user id from this access token
// validaet request body
router.put(
  "/",
  jwtCheck,
  jwtParse,
  validateMyUserRequest,
  MyUserController.updateCurrentUser
)

export default router
