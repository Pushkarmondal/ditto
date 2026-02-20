import { index } from "../infra/pinecone";

export async function upsertSemanticEntry({
  id,
  embedding,
  metadata,
}: {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}) {
  await index.upsert({
    records: [       
      {
        id,
        values: embedding,
        metadata,
      },
    ],
  });
}

export async function queryNearest({
  embedding,
  model,
  topK = 1,
}: {
  embedding: number[];
  model: string;
  topK?: number;
}) {
  const result = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: {
      model: { $eq: model },
    },
  });

  return result.matches?.[0] ?? null;
}
