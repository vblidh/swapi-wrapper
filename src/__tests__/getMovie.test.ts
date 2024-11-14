import CacheService from '../cache-service'
import { getMovie } from '../swapi-service'
import { Movie, Planet } from '../types'

jest.mock('../cache-service')

const mockMovie: Movie = {
  title: 'A New Hope',
  episode_id: 4,
  release_date: '1977-05-25',
  url: '',
  opening_crawl: '',
  director: '',
  producer: '',
  characters: [],
  planets: [
    'https://swapi.dev/api/planets/1/',
    'https://swapi.dev/api/planets/2/',
    'https://swapi.dev/api/planets/3/'
  ],
  starships: [],
  vehicles: [],
  species: []
}

const mockPlanets: Planet[] = [
  {
    name: 'Tatooine',
    rotation_period: '23',
    orbital_period: '304',
    url: 'https://swapi.dev/api/planets/1/'
  },
  {
    name: 'Alderaan',
    rotation_period: '24',
    orbital_period: '364',
    url: 'https://swapi.dev/api/planets/2/'
  },
  {
    name: 'Yavin IV',
    rotation_period: '24',
    orbital_period: '4818',
    url: 'https://swapi.dev/api/planets/3/'
  }
]

describe('getMovie', () => {
  it('should return the details of a specific movie', async () => {
    ;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
      (key, fallback) => {
        if (key === 'movies:1') {
          return Promise.resolve(mockMovie)
        }
        if (key === 'planets:1') {
          return Promise.resolve(mockPlanets[0])
        }
        if (key === 'planets:2') {
          return Promise.resolve(mockPlanets[1])
        }
        if (key === 'planets:3') {
          return Promise.resolve(mockPlanets[2])
        }
      }
    )

    const movie = await getMovie('1')

    expect(movie.title).toBe('A New Hope')
    expect(movie.planets).toEqual(mockPlanets.map(planet => planet.name))
  })
})
