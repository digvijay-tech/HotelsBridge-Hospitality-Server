const mongoose = require("mongoose");
const clusterise = require("./clusterise");

const connectDB = (DBURI, port, numOfCPUs, app) => {
    mongoose.connect(DBURI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }).then(() => {
        clusterise(port, numOfCPUs, app);
    }).catch((error) => {
        console.log(`Error: Failed to connect with Atlas..\n${error}`);
    });
}

module.exports = connectDB;
