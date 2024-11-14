import exp from 'constants'
import CacheService from '../cache-service'
import { getCharacters } from '../swapi-service'
import { Character } from '../types'

jest.mock('../cache-service')

const mockCharacters: Character[] = [
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
    films: [
      'https://swapi.dev/api/films/1/',
      'https://swapi.dev/api/films/2/',
      'https://swapi.dev/api/films/3/'
    ],
    species: [],
    vehicles: [],
    starships: [],
    url: 'https://swapi.dev/api/people/1/'
  },
  {
    name: 'Darth Vader',
    height: '202',
    mass: '136',
    hair_color: 'none',
    skin_color: 'white',
    eye_color: 'yellow',
    birth_year: '41.9BBY',
    gender: 'male',
    homeworld: 'https://swapi.dev/api/planets/1/',
    films: [
      'https://swapi.dev/api/films/1/',
      'https://swapi.dev/api/films/2/',
      'https://swapi.dev/api/films/3/'
    ],
    species: [],
    vehicles: [],
    starships: [],
    url: 'https://swapi.dev/api/people/4/'
  },
  {
    name: 'Padme Amidala',
    height: '185',
    mass: '45',
    hair_color: 'brown',
    skin_color: 'light',
    eye_color: 'brown',
    birth_year: '46BBY',
    films: [
      'https://swapi.dev/api/films/4/',
      'https://swapi.dev/api/films/5/',
      'https://swapi.dev/api/films/6/'
    ],
    species: [],
    gender: 'female',
    homeworld: 'https://swapi.dev/api/planets/2/',
    starships: [],
    url: 'https://swapi.dev/api/people/5/',
    vehicles: []
  }
]

;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
  (key, fallback) => {
    if (key === 'characters') {
      return Promise.resolve(mockCharacters)
    }
    return fallback()
  }
)

describe('getCharacters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return a list of characters when movie endpoint has been queried', async () => {
    ;(CacheService.getAllCategoryKeys as jest.Mock).mockResolvedValue([
      'movie:1',
      'movie:4'
    ])
    const characters = await getCharacters(null)

    expect(characters).toHaveLength(3)
    expect(characters[0].name).toBe('Luke Skywalker')
    expect(characters[1].name).toBe('Darth Vader')
  })

  it('should only return characters from movies that has been queried', async () => {
    ;(CacheService.getAllCategoryKeys as jest.Mock).mockResolvedValue([
      'movie:4'
    ])

    const characters = await getCharacters(null)
    expect(characters).toHaveLength(1)
    expect(characters[0].name).toBe('Padme Amidala')
  })

  it('should return characters filtered by movie ID', async () => {
    ;(CacheService.getAllCategoryKeys as jest.Mock).mockResolvedValue([
      'movie:1'
    ])

    const characters = await getCharacters('1')

    expect(characters).toHaveLength(2)
    expect(characters[0].name).toBe('Luke Skywalker')
    expect(characters[1].name).toBe('Darth Vader')
  })

  it('should return an empty list if no movies has been queried prior to the call regardless of movieId', async () => {
    ;(CacheService.getAllCategoryKeys as jest.Mock).mockResolvedValue([])
    
    const characters = await getCharacters('1')

    expect(characters).toHaveLength(0)
  })
})
