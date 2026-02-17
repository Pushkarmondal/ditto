import express from "express";
import dotenv from "dotenv";
import llmRoute from "./routes/app.routes"

dotenv.config();

const app = express();

app.use(express.json());
app.use(llmRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Semantic Cache Gateway running on port ${PORT}`);
});
