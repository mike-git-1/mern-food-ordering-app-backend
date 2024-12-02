import { Request, Response } from "express"
import Restaurant from "../models/restaurant"

// searching for restaurants
const searchRestaurant = async (req: Request, res: Response) => {
  try {
    // get the value of the param ':city'
    const city = req.params.city

    // get the search query parameter from the user
    // using type assertion to tell TypeScript to treat searchQuery as a string (Or empty string if none provided since its optional)
    // e.g api/restaurant/search/London?searchQuery=" "
    const searchQuery = (req.query.searchQuery as string) || ""

    // Note: selectedCuisines is an array in the frontend. When you send an array in the reqeust url, the backend treats it as a comma separated string
    const selectedCuisines = (req.query.selectedCuisines as string) || ""

    // will be passed to mongoose query to help specify how results will be sorted. Default to lastUpdated, eg. sort by most recent
    const sortOption = (req.query.sortOption as string) || "lastUpdated"

    // used by backedn to determine how many results to return on the page.
    const page = parseInt(req.query.page as string) || 1

    // in TypeScript, you're declaring a variable query of type any, which can hold any type of value.
    // This means you can assign values of any type (string, number, object, array, etc.) to query without TypeScript throwing any errors.
    // rare times you would use this
    let query: any = {}

    // defining and adding an option to our query obj under the key 'city'.
    // "i" flag is for ignore case e.g london = London = LONDON
    // query = {city: "London"}
    query["city"] = new RegExp(city, "i")
    // using MongoDB/Mongoose fn countDocument. It returns the count of documents that meet the given condition
    // e.g. MongoDB will scan the Restaurant collection and check each document for the city field for matches (e.g. {city: "London"})
    const cityCheck = await Restaurant.countDocuments(query)

    // if no matches, return an empty object. (Becasue the front end will be expecting an object with these properties.. will make it easier for the client handle for displaying in UI)
    if (cityCheck === 0) {
      res.status(404).json({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1,
        },
      })
      return
    }

    // if user filtered by cuisines
    if (selectedCuisines) {
      // get the selected cuisines (which is a comma separated string)
      // use split to convert into an array (each comma seaprated string is its own element)
      //  e.g URL = selectedCuisines=italian,chinese,mexican --> [italian, chinese, mexican]
      // map through the array and create a new regexp for each item
      const cuisinesArray = selectedCuisines
        .split(",")
        .map((cuisine) => new RegExp(cuisine, "i"))

      // uses the $all operator from MongoDB to allow you to match documents where the cuisines field of the restaurant document is an array that contains all the
      // elements in the cuisinesArray array,
      query["cuisines"] = { $all: cuisinesArray }
    }

    // if user entered a seach query
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i")
      // uses the $or operator to specify an array of conditions, and at least one of these conditions must be true for a document to match.
      // e.g. query will match documents where either the restaurantName matches the searchRegex, or the cuisines array contains a value that matches searchRegex.
      // e.g if a user searches "pizza", it will check both restaurantName and the cuisiens array for matches.
      query["$or"] = [
        { restaurantName: searchRegex },
        { cuisines: { $in: [searchRegex] } },
      ]
    }

    // number of results per page
    const pageSize = 10
    // used to naviage pages. e.g if user is on page 2, it will skip the first (2-1)*10 = 10 results.
    const skip = (page - 1) * pageSize

    // now that we have all our queries, find restaurants that match these queries (searchQuery + city + cuisiens)
    // will returns us a list of results that we will apply our filters,sort,and pagination on - sort, skip and limit are mongoDB methods
    //
    const restaurants = await Restaurant.find(query)
      // sort the resulst based on 'sortOption'. Using bracket notation since sortOption is dynamic field expeted to be a string
      // representing differnet options (e.g lastUpdated, delivery time, )
      // 1 indicates ascending order
      .sort({ [sortOption]: 1 })
      // used for pagination. determiens how many documents to skip over for a page
      .skip(skip)
      // limit number of results per page (e.g. if pageSize=10, restaurants will only contain max 10 documents)
      .limit(pageSize)
      // optimize the performance of queries by telling Mongoose to return plain JavaScript objects instead of Mongoose documents.
      // e.g. strips away the mongo Ids, methods and metadata. We're Just reading data and don't need access to Mongoose-specific methods for modifying (e.g. save(), update()...)
      .lean()

    // also get the total count of documents so we cand determine how many total pages there are for the query
    const total = await Restaurant.countDocuments(query)

    // for REST, common to return the pagination data along with the response data so that the frontend/UI can display this information in the UI easily
    const response = {
      data: restaurants,
      pagination: {
        total, // the total count
        page, // what page we're on
        pages: Math.ceil(total / pageSize), // 50 results, paegSize=10 > pages5
      },
    }
    // converts data to json (note: json() behaves differently on server vs client-side. On server, it parses data into JSON, not a javascript obj)
    res.json(response)

    // send a generic error message in JSON to the client
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Soemthing went wrong" })
  }
}

export default { searchRestaurant }
