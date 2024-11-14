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
 * @param {string} id - The ID of the movie.
 * @returns {Promise<Movie>} - A promise that resolves to the movie details.
 */
export async function getMovie (id: string): Promise<Movie> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const movieDetails = await CacheService.tryGetApiData<Movie>(
      `movies:${id}`,
      async () => {
        const response = await fetch(`${SWAPI_URL}/films/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch movie details')
        }
        return await response.json()
      }
    )

    const starshipPromises = Promise.all(
      movieDetails.starships.map(async (url: string) => {
        const starshipId = trimUrl(url).split('/').pop()
        const starship = await getStarship(starshipId!)
        return starship.name
      })
    )

    const planetPromises = Promise.all(
      movieDetails.planets.map(async (url: string) => {
        const planetId = trimUrl(url).split('/').pop()
        const planet = await getPlanet(planetId!)
        return planet.name
      })
    )

    const characterPromises = Promise.all(
      movieDetails.characters.map(async (url: string) => {
        const characterId = trimUrl(url).split('/').pop()
        const character = await getCharacter(characterId!)
        return character.name
      })
    )

    const [starships, planets, characters] = await Promise.all([
      starshipPromises,
      planetPromises,
      characterPromises
    ])

    movieDetails.starships = starships
    movieDetails.planets = planets
    movieDetails.characters = characters

    return movieDetails
  } catch (error) {
    console.error(`Error fetching movie with ID ${id}:`, error)
    throw error
  }
}

/**
 * Fetches and returns the details of a specific planet by its ID.
 * @param {string} id - The ID of the planet.
 * @returns {Promise<Planet>} - A promise that resolves to the planet details.
 */
async function getPlanet (id: string): Promise<Planet> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    return await CacheService.tryGetApiData(`planets:${id}`, async () => {
      const response = await fetch(`${SWAPI_URL}/planets/${id}`)
      if (!response.ok) throw new Error('Failed to fetch planet details')
      return await response.json()
    })
  } catch (error) {
    console.error(`Error fetching planet with ID ${id}:`, error)
    throw error
  }
}

/**
 * Fetches and returns the details of a specific starship by its ID.
 * @param {string} id - The ID of the starship.
 * @returns {Promise<Starship>} - A promise that resolves to the starship details.
 */
async function getStarship (id: string): Promise<Starship> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    return await CacheService.tryGetApiData(`starships:${id}`, async () => {
      const response = await fetch(`${SWAPI_URL}/starships/${id}`)
      if (!response.ok) throw new Error('Failed to fetch starship details')
      return await response.json()
    })
  } catch (error) {
    console.error(`Error fetching starship with ID ${id}:`, error)
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
 * Fetches and returns a list of characters.
 * Only includes characters that appear in currently fetched movies.
 * @returns {Promise<Character[]>} - A promise that resolves to a list of characters.
 */
export async function getCharacters (
  movieId: string | null
): Promise<Character[]> {
  const SWAPI_URL = process.env.SWAPI_URL

  try {
    const characters = await CacheService.tryGetApiData(
      'characters',
      async () => {
        const response = await fetch(`${SWAPI_URL}/people`)
        if (!response.ok) throw new Error('Failed to fetch characters')
        const data: ApiResponse<Character> = await response.json()

        const totalPages = Math.ceil(data.count / 10)
        const requests: Promise<Response>[] = []
        for (let i = 2; i <= totalPages; i++) {
          requests.push(fetch(`${SWAPI_URL}/people?page=${i}`))
        }

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

    const movieKeys = await CacheService.getAllCategoryKeys('movies')
    const currentlyFetchedMovieIds = movieKeys.map(key => key.split(':').pop())
    const allowedCharacters = characters.filter(character =>
      character.films.some(movieUrl => {
        const characterMovieId = trimUrl(movieUrl).split('/').pop()
        const isAllowed = currentlyFetchedMovieIds.includes(characterMovieId)
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
  } catch (error) {
    console.error('Error fetching characters:', error)
    throw error
  }
}

/**
 * Trims the trailing slash from a URL if it exists.
 * @param {string} url - The URL to trim.
 * @returns {string} - The trimmed URL.
 */
function trimUrl (url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
