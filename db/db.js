import mongoose from "mongoose";

const connection = () => {
    mongoose.connect(
        "mongodb+srv://dombeshivam80:MH22Aura@cluster0.8rftp.mongodb.net/clustor0",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
        }
    )
    .then(() => console.log("MongoDB Connected successfully..."))
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exit(1); // Exit the process if the connection fails
    });

    // Event listeners for additional debugging
    mongoose.connection.on("connected", () => {
        console.log("Mongoose connected to the database");
    });

    mongoose.connection.on("error", (err) => {
        console.error("Mongoose connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
        console.log("Mongoose disconnected");
    });

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("Mongoose disconnected on app termination");
        process.exit(0);
    });
};

export default connection;
