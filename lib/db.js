import "server-only";
import { MongoClient } from "mongodb";
import { mongoConfig } from "./mongo-config.mjs";
const globalCache = globalThis;
export async function getClient() {
  const { uri } = mongoConfig(process.env);
  if (!globalCache.marlogolMongo || globalCache.marlogolMongoUri !== uri) {
    const old = globalCache.marlogolMongo;
    if (old) old.then(client => client.close()).catch(() => {});
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 10000, maxPoolSize: 10 });
    const promise = client.connect().catch(async error => {
      if (globalCache.marlogolMongo === promise) {
        globalCache.marlogolMongo = undefined;
        globalCache.marlogolMongoUri = undefined;
      }
      await client.close().catch(() => {});
      throw error;
    });
    globalCache.marlogolMongoUri = uri;
    globalCache.marlogolMongo = promise;
  }
  return globalCache.marlogolMongo;
}
export async function getDb() {
  const { name } = mongoConfig(process.env);
  return (await getClient()).db(name);
}
export function plain(doc) { if (!doc) return null; const { _id, ...rest } = doc; return rest; }
