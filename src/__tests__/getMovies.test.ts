import CacheService from '../cache-service'
import { getMovies } from '../swapi-service'
import { Movie } from '../types'

jest.mock('../cache-service')

const mockMovies: Movie[] = [
  {
    title: 'A New Hope',
    episode_id: 4,
    release_date: '1977-05-25',
    url: '',
    opening_crawl: '',
    director: '',
    producer: '',
    characters: [],
    planets: [],
    starships: [],
    vehicles: [],
    species: []
  },
  {
    title: 'Attack of the Clones',
    episode_id: 2,
    release_date: '2002-05-16',
    url: '',
    opening_crawl: '',
    director: '',
    producer: '',
    characters: [],
    planets: [],
    starships: [],
    vehicles: [],
    species: []
  }
]

describe('getMovies', () => {
  it('should return a list of movies in correct order', async () => {
    // Mock the tryGetApiData method to return mockMovies
    ;(CacheService.tryGetApiData as jest.Mock).mockResolvedValue(mockMovies)

    const movies = await getMovies('release', 'ascending')
    expect(movies).toEqual(mockMovies)

    const moviesDescending = await getMovies('release', 'descending')
    expect(moviesDescending).toEqual(mockMovies.reverse())

    const moviesByEpisode = await getMovies('episode', 'ascending')
    const first = moviesByEpisode[0]
    expect(first.episode_id).toBe(2)
  })
})
