import { createClient } from 'redis'

class CacheService {
  private client: ReturnType<typeof createClient> | null = null

  /**
   * Initializes the Redis cache client.
   * @returns {Promise<void>}
   */
  async initRedisCache (): Promise<void> {
    this.client = createClient({}).on('error', (err: any) =>
      console.error('Redis Client Error', err)
    )
    await this.client.connect()
  }

  /**
   * Sets a value in the cache.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @returns {Promise<void>}
   */
  async setValue (key: string, value: string): Promise<void> {
    if (this.client) {
      await this.client.set(`api:${key}`, value)
    }
  }

  /**
   * Gets a value from the cache and parses it as JSON.
   * @param {string} key - The key to get.
   * @returns {Promise<T | null>} - The parsed value or null if not found.
   */
  async getApiResponseFromCache<T> (key: string): Promise<T | null> {
    if (this.client) {
      const value = await this.client.get(`api:${key}`)
      return value ? JSON.parse(value) : null
    }
    return null
  }

  /**
   * Checks if a key exists in the cache.
   * @param {string} key - The key to check.
   * @returns {Promise<boolean>} - True if the key exists, false otherwise.
   */
  async hasKey (key: string): Promise<boolean> {
    if (this.client) {
      return (await this.client.exists(key)) === 1
    }
    return false
  }

  /**
   * Gets all keys in a specific category.
   * @param {string} category - The category to search.
   * @returns {Promise<string[]>} - An array of keys.
   */
  async getAllCategoryKeys (category: string): Promise<string[]> {
    if (this.client) {
      return await this.client.keys(`api:${category}:*`)
    }
    return []
  }

  /**
   * Tries to get data from the cache, falling back to a provided function if not found.
   * @param {string} key - The key to get.
   * @param {() => Promise<T>} fallback - The fallback function to call if the key is not found.
   * @returns {Promise<T>} - The cached or fallback value.
   */
  async tryGetApiData<T> (key: string, fallback: () => Promise<T>): Promise<T> {
    const value = await this.getApiResponseFromCache<T>(key)
    if (!value) {
      const fallbackValue = await fallback()
      await this.setValue(key, JSON.stringify(fallbackValue))
      return fallbackValue
    }
    return value
  }
}

export default new CacheService()
