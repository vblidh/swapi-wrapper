import CacheService from '../cache-service'
import { getCharacter } from '../swapi-service'
import { Character } from '../types'

jest.mock('../cache-service')

const mockCharacter: Character = {
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
}

describe('getCharacter', () => {
  beforeEach(() => {
    process.env.SWAPI_URL = 'https://swapi.dev/api'
    jest.clearAllMocks()
  })

  it('should return character details when character is found in cache', async () => {
    ;(CacheService.tryGetApiData as jest.Mock).mockResolvedValue(mockCharacter)

    const character = await getCharacter('1')

    expect(character).toEqual(mockCharacter)
    expect(CacheService.tryGetApiData).toHaveBeenCalledWith(
      'characters:1',
      expect.any(Function)
    )
  })

  it('should fetch character details from API when not found in cache', async () => {
    ;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
      async (key, fallback) => {
        if (key === 'characters:1') {
          return fallback()
        }
        return null
      }
    )

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCharacter
    })

    const character = await getCharacter('1')

    expect(character).toEqual(mockCharacter)
    expect(CacheService.tryGetApiData).toHaveBeenCalledWith(
      'characters:1',
      expect.any(Function)
    )
    expect(global.fetch).toHaveBeenCalledWith('https://swapi.dev/api/people/1')
  })

  it('should throw an error if the API request fails', async () => {
    ;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
      async (key, fallback) => {
        if (key === 'characters:1') {
          // Data not available in cache. Make the API request.
          return fallback()
        }
        return null
      }
    )

    global.fetch = jest.fn().mockResolvedValue({
      ok: false
    })

    await expect(getCharacter('1')).rejects.toThrow(
      'Failed to fetch character details'
    )
    expect(CacheService.tryGetApiData).toHaveBeenCalledWith(
      'characters:1',
      expect.any(Function)
    )
    expect(global.fetch).toHaveBeenCalledWith('https://swapi.dev/api/people/1')
  })

  it('should include film titles if includeFilmTitle is true', async () => {
    const mockMovies = [
      {
        url: 'https://swapi.dev/api/films/1/',
        title: 'A New Hope',
        release_date: '1977-05-25'
      },
      {
        url: 'https://swapi.dev/api/films/2/',
        title: 'The Empire Strikes Back',
        release_date: '1980-05-17'
      },
      {
        url: 'https://swapi.dev/api/films/3/',
        title: 'Return of the Jedi',
        release_date: '1983-05-25'
      }
    ]

    ;(CacheService.tryGetApiData as jest.Mock).mockImplementation(
      async (key, fallback) => {
        if (key === 'characters:1') {
          return mockCharacter
        }
        if (key === 'movies') {
          return mockMovies
        }
        return fallback()
      }
    )

    const character = await getCharacter('1', true)

    expect(CacheService.tryGetApiData).toHaveBeenCalledWith(
      'movies',
      expect.any(Function)
    )

    expect(character.films).toEqual([
      'A New Hope',
      'The Empire Strikes Back',
      'Return of the Jedi'
    ])
  })
})
