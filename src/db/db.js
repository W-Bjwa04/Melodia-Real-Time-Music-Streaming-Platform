import mongoose from "mongoose";
import logger from "../config/logger.js";

mongoose.set("debug", function (collectionName, method, query, doc) {
    logger.debug("MongoDB query", {
        collection: collectionName,
        method,
        query,
        doc,
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DATABASE_NAME}`);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export default connectDB


