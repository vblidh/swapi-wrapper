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
   * Gets a value from the cache.
   * @param {string} key - The key to get.
   * @returns {Promise<string | null>} - The value or null if not found.
   */
  async getValue (key: string): Promise<string | null> {
    if (this.client) {
      return this.client.get(`api:${key}`)
    }
    return null
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
    const value = await this.getValue(key)
    return value ? JSON.parse(value) : null
  }

  /**
   * Updates the list of fetched movies for a specific user by adding a new movie ID.
   * Will not add the movie if it already exists in the list.
   *
   * @param clientId - The unique identifier of the client/user.
   * @param movieId - The unique identifier of the movie to be added.
   * @returns A promise that resolves to void.
   */
  async updateFetchedMoviesByUser (
    clientId: string,
    movieId: string
  ): Promise<void> {
    const key = `client:${clientId}:movies`
    const movies = await this.getFetchedMoviesByUser(clientId)
    if (movies) {
      if (movies.includes(movieId)) {
        return
      }
      movies.push(movieId)
      await this.setValue(key, JSON.stringify(movies))
    } else {
      await this.setValue(key, JSON.stringify([movieId]))
    }
  }

  /**
   * Retrieves the list of movie IDs fetched by a specific user from the cache.
   *
   * @param clientId - The unique identifier of the client/user.
   * @returns A promise that resolves to an array of movie IDs fetched by the user.
   *          If the client is not available or no movies are found, an empty array is returned.
   */
  async getFetchedMoviesByUser (clientId: string): Promise<string[]> {
    const key = `client:${clientId}:movies`
    const movieIds = await this.getValue(key)
    if (movieIds) {
      return JSON.parse(movieIds)
    }

    return []
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
      // Do the API call
      const fallbackValue = await fallback()
      await this.setValue(key, JSON.stringify(fallbackValue))
      return fallbackValue
    }
    return value
  }
}

export default new CacheService()
