// import { Pinecone } from "@pinecone-database/pinecone";

// const pc = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY!,
// });

// console.log("Using Pinecone index:", process.env.PINECONE_INDEX_NAME);

// export const index = pc.index({
//   name: process.env.PINECONE_INDEX_NAME!,
// });

// // const indexes = await pc.listIndexes();
// // console.log("Available indexes:", indexes);


// import { Pinecone } from "@pinecone-database/pinecone";

// const pc = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY!,
// });

// const indexName = process.env.PINECONE_INDEX_NAME!;
// // Fetch host dynamically
// const indexes = await pc.listIndexes();
// // console.log(indexes);
// const target = indexes.indexes?.find(i => i.name === indexName);

// if (!target) {
//   throw new Error(`Index ${indexName} not found`);
// }

// export const index = pc.index({ host: target.host });


import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// First describe the index to get its host
const indexDescription = await pc.describeIndex(process.env.PINECONE_INDEX_NAME!);

export const index = pc.index({
  host: indexDescription.host,  // ✅ use host, not name
});