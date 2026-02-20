import express from "express";
import dotenv from "dotenv";
import llmRoute from "./routes/app.routes"
import { connectRedis } from "./infra/redis";

dotenv.config();

const app = express();

app.use(express.json());
app.use(llmRoute);

const PORT = process.env.PORT || 3000;



async function start() {
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`Semantic Cache Gateway running on port ${PORT}`);
    });
}

start();
