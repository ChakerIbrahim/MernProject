/**
 * mongoose.config.js
 * Initializes the MongoDB connection using Mongoose.
 * Required by server.js at startup.
 */
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGOOSE_URI)
    .then(() => console.log('Established a connection to the database'))
    .catch(err => console.error('Something went wrong when connecting to the database ', err));
