import mongoose from 'mongoose'
import dns from 'dns'

// Fallback DNS for local development if SRV lookups fail (common on Windows/Docker/virtual network interfaces)
if (process.env.NODE_ENV !== 'production') {
  try {
    const servers = dns.getServers()
    const fallbackServers = ['8.8.8.8', '1.1.1.1']
    // Merge list, preserving system DNS after fallback resolvers, and filtering duplicates
    const finalServers = Array.from(new Set([...fallbackServers, ...servers]))
    dns.setServers(finalServers)
  } catch (err) {
    console.warn('Failed to configure custom local DNS resolver:', err)
  }
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || ''

const isNextBuild = !!process.env.NEXT_PHASE

if (!MONGODB_URI && process.env.NODE_ENV === 'production' && !isNextBuild) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCached: MongooseCache | undefined
}

if (!global.mongooseCached) {
  global.mongooseCached = { conn: null, promise: null }
}
const cached = global.mongooseCached

async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    // In dev we can log a warning or fall back gracefully.
    console.warn('MONGODB_URI is not set. Database operations will fail.')
    return mongoose
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect
