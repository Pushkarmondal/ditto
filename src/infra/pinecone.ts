import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const index = pc.index({
  name: process.env.PINECONE_INDEX_NAME!,
});

// const indexes = await pc.listIndexes();
// console.log("Available indexes:", indexes);