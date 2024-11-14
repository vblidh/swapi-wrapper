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
  characters: [
    'https://swapi.dev/api/people/1/'
  ],
  planets: [
    'https://swapi.dev/api/planets/1/',
    'https://swapi.dev/api/planets/2/',
    'https://swapi.dev/api/planets/3/'
  ],
  starships: [
    'https://swapi.dev/api/starships/9/'
  ],
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

const mockStarships = [
  {
    name: 'Death Star',
    model: 'DS-1 Orbital Battle Station',
    manufacturer: 'Imperial Department of Military Research',
    cost_in_credits: '1000000000000',
    length: '120000',
    max_atmosphering_speed: 'n/a',
    crew: '342,953',
    passengers: '843,342',
    cargo_capacity: '1000000000000',
    consumables: '3 years',
    hyperdrive_rating: '4.0',
    MGLT: '10',
    starship_class: 'Deep Space Mobile Battlestation',
    pilots: [],
    films: ['https://swapi.dev/api/films/1/'],
    url: 'https://swapi.dev/api/starships/9/'
  }
]

const mockCharacters = [
  {
    name: 'Luke Skywalker',
    height: '172',
    mass: '77',
    hair_color: 'blond',
    skin_color: 'fair',
    eye_color: 'blue',
    birth_year: '19BBY',
    gender: 'male',
    homeworld: 'https://swapi.dev/api/planets/1/',
    films: ['https://swapi.dev/api/films/1/'],
    species: [],
    vehicles: [],
    starships: ['https://swapi.dev/api/starships/12/'],
    url: 'https://swapi.dev/api/people/1/'
  }
]

describe('getMovie', () => {
  it('should return the details of a specific movie', async () => {
    ;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
      (key, fallback) => {
        if (key === 'movies:1') {
          return Promise.resolve(mockMovie)
        }
        if (key === 'planets') {
          return Promise.resolve(mockPlanets)
        }
        if (key === 'characters') {
          return Promise.resolve(mockCharacters)
        }
        if (key === 'starships') {
          return Promise.resolve(mockStarships)
        }
      }
    )

    const movie = await getMovie('1')

    expect(movie.title).toBe('A New Hope')
    expect(movie.planets).toEqual(mockPlanets.map(planet => planet.name))
    expect(movie.characters).toEqual(mockCharacters.map(character => character.name))
    expect(movie.starships).toEqual(mockStarships.map(starship => starship.name))
  })
})
