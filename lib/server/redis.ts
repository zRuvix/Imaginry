import "server-only";
import { createClient } from "redis";

function makeClient(url: string) {
  const client = createClient({
    url,
    socket: { connectTimeout: 5000, reconnectStrategy: (retries) => Math.min(retries * 200, 3000) },
  });
  client.on("error", (e) => console.error("[redis]", e.message));
  return client;
}

type Client = ReturnType<typeof makeClient>;

// One connection per server process; kept on globalThis so dev hot reloads
// don't open a new connection each time.
const globalForRedis = globalThis as unknown as { redis?: Promise<Client> };

export function redis(): Promise<Client> {
  if (!globalForRedis.redis) {
    const url = process.env.REDIS_URL;
    if (!url) return Promise.reject(new Error("REDIS_URL is not set"));
    globalForRedis.redis = makeClient(url)
      .connect()
      .catch((e) => {
        globalForRedis.redis = undefined;
        throw e;
      });
  }
  return globalForRedis.redis;
}
