import {
  ApiResponse,
  Movie,
  Character,
  SortType,
  OrderDirection,
  Planet,
  Starship
} from './types'
import CacheService from './cache-service'
import cacheService from './cache-service'

/**
 * Fetches and returns a list of movies, sorted by the specified criteria.
 * @param {SortType} sort - The type of sorting (e.g., 'release' or 'episode').
 * @param {OrderDirection} order - The order direction ('ascending' or 'descending').
 * @returns {Promise<Movie[]>} - A promise that resolves to a list of movies.
 */
export async function getMovies (
  sort: SortType,
  order: OrderDirection
): Promise<Movie[]> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const data = await CacheService.tryGetApiData<Movie[]>(
      'movies',
      async () => {
        const response = await fetch(`${SWAPI_URL}/films`)
        if (!response.ok) throw new Error('Failed to fetch movies')
        const data = await response.json()
        return data.results
      }
    )

    data.sort((a: Movie, b: Movie) => {
      if (sort === 'release') {
        return order === 'ascending'
          ? a.release_date.localeCompare(b.release_date)
          : b.release_date.localeCompare(a.release_date)
      }

      return order === 'ascending'
        ? a.episode_id - b.episode_id
        : b.episode_id - a.episode_id
    })

    return data
  } catch (error) {
    console.error('Error fetching movies:', error)
    throw error
  }
}

/**
 * Fetches and returns the details of a specific movie by its ID.
 * @param {string} movieId - The ID of the movie.
 * @param {string} clientId - The ID of the client making the request.
 * @returns {Promise<Movie>} - A promise that resolves to the movie details.
 */
export async function getMovie (movieId: string, clientId: string): Promise<Movie> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const movieDetails = await CacheService.tryGetApiData<Movie>(
      `movies:${movieId}`,
      async () => {
        const response = await fetch(`${SWAPI_URL}/films/${movieId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch movie details')
        }
        return await response.json()
      }
    )

    const planetsPromise = getPlanets()
    const starshipPromise = getStarships()
    const characterPromise = getCharacters()

    const [starships, planets, characters] = await Promise.all([
      starshipPromise,
      planetsPromise,
      characterPromise
    ])

    movieDetails.starships = starships
      .filter(s => movieDetails.starships.includes(s.url))
      .map(s => s.name)
    movieDetails.planets = planets
      .filter(p => movieDetails.planets.includes(p.url))
      .map(p => p.name)
    movieDetails.characters = characters
      .filter(c => movieDetails.characters.includes(c.url))
      .map(c => c.name)

    cacheService.updateFetchedMoviesByUser(clientId, movieId)

    return movieDetails
  } catch (error) {
    console.error(`Error fetching movie with ID ${movieId}:`, error)
    throw error
  }
}

/**
 * Fetches all planets from the SWAPI (Star Wars API) and caches the result.
 *
 * This function retrieves the planets data from the SWAPI, handling pagination
 * to ensure all pages of results are fetched. The data is then cached using
 * the CacheService to avoid redundant API calls.
 *
 * @returns {Promise<Planet[]>} A promise that resolves to an array of Planet objects.
 *
 * @throws {Error} Throws an error if the fetch operation fails.
 */
async function getPlanets (): Promise<Planet[]> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    return await CacheService.tryGetApiData(`planets`, async () => {
      const response = await fetch(`${SWAPI_URL}/planets`)
      if (!response.ok) throw new Error('Failed to fetch planets')
      const data: ApiResponse<Planet> = await response.json()
      const totalPages = Math.ceil(data.count / 10)
      const requests = fetchAllPages(totalPages, `${SWAPI_URL}/planets`)
      const responses = await Promise.all(requests)
      const planetResponses: ApiResponse<Planet>[] = await Promise.all(
        responses.map(res => res.json())
      )
      planetResponses.forEach(pageData => {
        data.results = data.results.concat(pageData.results)
      })
      return data.results
    })
  } catch (error) {
    console.error(`Error fetching planets:`, error)
    throw error
  }
}

/**
 * Fetches all starships from the SWAPI (Star Wars API) and caches the result.
 *
 * This function retrieves the starships data from the SWAPI, handling pagination
 * to ensure all pages of results are fetched. The data is then cached using
 * the CacheService to avoid redundant API calls.
 *
 * @returns {Promise<Starship[]>} A promise that resolves to an array of Starship objects.
 *
 * @throws {Error} Throws an error if the fetch operation fails.
 */
async function getStarships (): Promise<Starship[]> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    return await CacheService.tryGetApiData(`starships`, async () => {
      const response = await fetch(`${SWAPI_URL}/starships`)
      if (!response.ok) throw new Error('Failed to fetch starships')
      const data: ApiResponse<Starship> = await response.json()
      const totalPages = Math.ceil(data.count / 10)
      const requests = fetchAllPages(totalPages, `${SWAPI_URL}/starships`)
      const responses = await Promise.all(requests)
      const starshipResponses: ApiResponse<Starship>[] = await Promise.all(
        responses.map(res => res.json())
      )
      starshipResponses.forEach(pageData => {
        data.results = data.results.concat(pageData.results)
      })
      return data.results
    })
  } catch (error) {
    console.error(`Error fetching starships:`, error)
    throw error
  }
}

/**
 * Fetches and returns the details of a specific character by its ID.
 * Optionally includes the titles of the films the character appears in.
 * @param {string} id - The ID of the character.
 * @param {boolean} [includeFilmTitle=false] - Whether to include film titles.
 * @returns {Promise<Character>} - A promise that resolves to the character details.
 */
export async function getCharacter (
  id: string,
  includeFilmTitle: boolean = false
): Promise<Character> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const character = await CacheService.tryGetApiData<Character>(
      `characters:${id}`,
      async () => {
        const response = await fetch(`${SWAPI_URL}/people/${id}`)
        if (!response.ok) throw new Error('Failed to fetch character details')
        return await response.json()
      }
    )

    if (!includeFilmTitle) {
      return character
    }

    const films = await getMovies('release', 'ascending')
    character.films = character.films.map((filmUrl: string) => {
      const filmId = trimUrl(filmUrl).split('/').pop() || ''
      const film = films.find(film => film.url.includes(filmId))
      return film?.title || ''
    })

    return character
  } catch (error) {
    console.error(`Error fetching character with ID ${id}:`, error)
    throw error
  }
}

/**
 * Fetches a list of characters from the SWAPI (Star Wars API).
 *
 * This function attempts to retrieve character data from a cache first.
 * If the data is not available in the cache, it fetches the data from the SWAPI.
 * It handles pagination by fetching all pages of character data and concatenating the results.
 *
 * @returns {Promise<Character[]>} A promise that resolves to an array of Character objects.
 * @throws Will throw an error if the fetch operation fails.
 */
async function getCharacters (): Promise<Character[]> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const characters = await CacheService.tryGetApiData(
      'characters',
      async () => {
        const response = await fetch(`${SWAPI_URL}/people`)
        if (!response.ok) throw new Error('Failed to fetch characters')
        const data: ApiResponse<Character> = await response.json()

        const totalPages = Math.ceil(data.count / 10)

        const requests = fetchAllPages(totalPages, `${SWAPI_URL}/people`)
        const responses = await Promise.all(requests)
        const results: ApiResponse<Character>[] = await Promise.all(
          responses.map(res => res.json())
        )

        results.forEach(pageData => {
          data.results = data.results.concat(pageData.results)
        })

        return data.results
      }
    )

    return characters
  } catch (error) {
    console.error('Error fetching characters:', error)
    throw error
  }
}

/**
 * Fetches characters with filters applied based on the provided movie ID.
 *
 * This function retrieves all characters and filters them based on the movies they appear in.
 * If a `movieId` is provided, only characters from that specific movie are returned.
 * If no `movieId` is provided, characters from all currently fetched movies are returned.
 * Note that only characters in movies that are currently in the cache are considered.
 *
 * @param {string | null} movieId - The ID of the movie to filter characters by. If null, characters from all movies are returned.
 * @returns {Promise<Character[]>} A promise that resolves to an array of filtered characters.
 */
export async function getCharactersWithFilters (
  movieId: string | null,
  clientId: string
): Promise<Character[]> {
  const [characters, fetchedMovieIds] = await Promise.all([
    getCharacters(),
    CacheService.getFetchedMoviesByUser(clientId)
  ])
  
  const allowedCharacters = characters.filter(character =>
    character.films.some(movieUrl => {
      const characterMovieId = trimUrl(movieUrl).split('/').pop() || ''
      const isAllowed = fetchedMovieIds.includes(characterMovieId)
      if (!isAllowed) {
        return false
      }

      if (movieId) {
        return characterMovieId === movieId
      }

      return true
    })
  )

  return allowedCharacters
}

/**
 * Fetches all pages from a paginated API endpoint starting from the second page.
 *
 * @param totalPages - The total number of pages to fetch.
 * @param url - The base URL of the API endpoint.
 * @returns An array of promises, each resolving to a Response object for each page.
 */
const fetchAllPages = (
  totalPages: number,
  url: string
): Promise<Response>[] => {
  const requests: Promise<Response>[] = []
  for (let i = 2; i <= totalPages; i++) {
    requests.push(fetch(`${url}?page=${i}`))
  }
  return requests
}

/**
 * Trims the trailing slash from a URL if it exists.
 * @param {string} url - The URL to trim.
 * @returns {string} - The trimmed URL.
 */
function trimUrl (url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
