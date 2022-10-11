// entry point for node app
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();


// cors node modules
const os = require("os");

// utility modules
const connectDB = require("./utility/connectDB");

// authentication modules
const adminLogin = require("./auth/adminLogin");
const createUser = require("./auth/createUser");
const userLogin = require("./auth/userLogin");
const adminPasswordupdate = require("./auth/adminPasswordUpdate");

// API modules
const rooms = require("./api/rooms");
const profiles = require("./api/profiles");
const feedbacks = require("./api/feedbacks");
const orders = require("./api/orders");
const requests = require("./api/requests");
const activityLogs = require("./api/activityLogs");


// initializing express app
const app = express();


// setting default express middlewares
app.set("x-powered-by", false);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger("dev"));
app.use(cors());



// adding authentication routes to the app
app.use(adminLogin);
app.use(createUser);
app.use(userLogin);
app.use(adminPasswordupdate);
app.use(rooms);
app.use(profiles);
app.use(feedbacks);
app.use(orders);
app.use(requests);
app.use(activityLogs);





// connecting to DB & starting the server
const port = process.env.PORT || 3000;
const numOfCPUs = os.cpus().length;
connectDB(process.env.ATLAS_CONNECTION_URL, port, numOfCPUs, app);
