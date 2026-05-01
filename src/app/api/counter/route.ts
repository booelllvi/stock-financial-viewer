import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const KEY = 'stock_viewer_visits'

export async function GET() {
  const count = (await redis.get<number>(KEY)) ?? 0
  return Response.json({ count })
}

export async function POST() {
  const count = await redis.incr(KEY)
  return Response.json({ count })
}
