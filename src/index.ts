import express, { Express, Request, Response } from 'express'
import { Movie, OrderDirection, SortType } from './types'

import dotenv from 'dotenv'
dotenv.config()

import CacheService from './cache-service'
import { getCharacter, getCharacters, getMovie, getMovies } from './swapi-service'

async function startServer () {
  await CacheService.initRedisCache()

  const app: Express = express()
  const PORT: string | number = process.env.PORT || 3000

  app.get('/movies', async (req: Request, res: Response) => {
    const { sort, order } = req.query as {
      sort: SortType
      order: OrderDirection
    }

    const movies = await getMovies(sort, order)

    const movieResponse = movies.map(movie => ({
      title: movie.title,
      episode: movie.episode_id,
      releaseDate: movie.release_date
    }))
    res.send(movieResponse)
  })

  app.get('/movies/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    const movie = await getMovie(id)

    const movieResponse = {
      title: movie.title,
      episode: movie.episode_id,
      openingCrawl: movie.opening_crawl,
      director: movie.director,
      producer: movie.producer,
      releaseDate: movie.release_date,
      characters: movie.characters,
      planets: movie.planets,
      starships: movie.starships
    }

    res.send(movieResponse)
  })

  app.get('/characters', async (req: Request, res: Response) => {
    const characters = await getCharacters()

    const characterResponse = characters.map((character: any) => ({
      name: character.name,
      homeWorld: character.homeworld
    }))

    res.send(characterResponse)
  })

  app.get('/characters/:id', async (req: Request, res: Response) => {
    const { id } = req.params

    const character = await getCharacter(id, true)

    const characterResponse = {
      name: character.name,
      height: character.height,
      mass: character.mass,
      gender: character.gender,
      hairColor: character.hair_color,
      skinColor: character.skin_color,
      films: character.films,
    }

    res.send(characterResponse)
  })

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

const isLocalRequest = (req: Request) => {
  const ip =
    req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
  return ip === '127.0.0.1' || ip === '::1'
}

startServer()
  .catch(err => {
    console.error('Failed to start server:', err)
  })
  .finally(() => {
    console.info('Server shutting down')
  })
