import express, { Express, Request, Response } from 'express'
import { Movie, OrderDirection, SortType } from './types'

import dotenv from 'dotenv'
dotenv.config()

import CacheService from './cache-service'
import { getCharacter, getCharactersWithFilters, getMovie, getMovies } from './swapi-service'
import { MovieResponse, DetailedMovieResponse } from './models/MovieResponse'
import { CharacterResponse, DetailedCharacterResponse } from './models/CharacterResponse'

async function startServer () {
  await CacheService.initRedisCache()

  const app: Express = express()
  const PORT: string | number = process.env.PORT || 3000

  app.get('/movies', async (req: Request, res: Response) => {
    try {
      const { sort, order } = req.query as {
        sort: SortType
        order: OrderDirection
      }

      const movies = await getMovies(sort, order)

      const movieResponse: MovieResponse[] = movies.map(movie => ({
        title: movie.title,
        episode: movie.episode_id,
        releaseDate: movie.release_date
      }))
      res.send(movieResponse)
    } catch (error) {
      console.error('Error fetching movies:', error)
      res.status(500).send({ error: 'Failed to fetch movies' })
    }
  })

  app.get('/movies/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    try {
      const movie = await getMovie(id)

      const movieResponse: DetailedMovieResponse = {
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
    } catch (error) {
      console.error(`Error fetching movie with ID ${id}:`, error)
      res.status(500).send({ error: 'Failed to fetch movie details' })
    }
  })

  app.get('/characters', async (req: Request, res: Response) => {
    try {
      const { movie: movieId } = req.query as { movie: string | null }
      const characters = await getCharactersWithFilters(movieId)

      const characterResponse: CharacterResponse[] = characters.map((character: any) => ({
        name: character.name,
        homeWorld: character.homeworld
      }))

      res.send(characterResponse)
    } catch (error) {
      console.error('Error fetching characters:', error)
      res.status(500).send({ error: 'Failed to fetch characters' })
    }
  })

  app.get('/characters/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    try {

      const character = await getCharacter(id, true)

      const characterResponse: DetailedCharacterResponse = {
        name: character.name,
        height: character.height,
        mass: character.mass,
        gender: character.gender,
        hairColor: character.hair_color,
        homeWorld: character.homeworld,
        skinColor: character.skin_color,
        films: character.films,
      }

      res.send(characterResponse)
    } catch (error) {
      console.error(`Error fetching character with ID ${id}:`, error)
      res.status(500).send({ error: 'Failed to fetch character details' })
    }
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
