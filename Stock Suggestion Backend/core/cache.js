import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables for configuration
dotenv.config();

class CacheService {
    constructor() {
        this.client = null;
        this.isRedis = false;
        // In-memory fallback: A standard JavaScript Map
        this.memoryCache = new Map(); 
        this.connect(); // Attempt connection immediately
    }

    async connect() {
        try {
            const redisUrl = process.env.REDIS_URL; 
            
            // 1. Attempt to connect to Redis if URL is provided
            if (redisUrl && redisUrl.trim() !== '') {
                this.client = createClient({ url: redisUrl });
                this.client.on('error', (err) => console.error('Redis Client Error', err));
                await this.client.connect();
                this.isRedis = true;
                console.log('✅ CacheService: Connected to Redis.');
            } else {
                // 2. Fallback if REDIS_URL is not set (Local Dev)
                this.client = this.memoryCache;
                console.log('⚠️ CacheService: REDIS_URL not set. Falling back to in-memory cache.');
            }
        } catch (error) {
            // 3. Fallback if connection fails (Redis server is down)
            console.error('❌ CacheService: Failed to connect to Redis, falling back to in-memory.', error);
            this.client = this.memoryCache;
        }
    }

    /**
     * Stores a key-value pair in the cache with an optional TTL (Time-To-Live).
     */
    async set(key, value, ttl = 43200) { // Default 12 hours for batch data
        if (!key || typeof value === 'undefined') return;
        const stringValue = JSON.stringify(value);
        if (this.isRedis) {
            // Redis: uses built-in expiry
            await this.client.set(key, stringValue, { EX: ttl });
        } else {
            // In-memory: uses manual setTimeout expiry
            this.memoryCache.set(key, stringValue);
            if (ttl > 0) {
                setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
            }
        }
    }

    /**
     * Retrieves a value from the cache.
     */
    async get(key) {
        if (!key) return null;
        
        let stringValue;
        if (this.isRedis) {
            stringValue = await this.client.get(key);
        } else {
            stringValue = this.memoryCache.get(key);
        }

        if (!stringValue) return null;
        
        try {
            // Must parse the string back into a JavaScript object
            return JSON.parse(stringValue);
        } catch (e) {
            console.error('CacheService: Failed to parse cached value.', e);
            return null;
        }
    }
}

const cacheService = new CacheService();
export default cacheService;