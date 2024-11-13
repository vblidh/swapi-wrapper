
export interface MovieResponse {
  title: string;
  episode: number;
  releaseDate: string;
}

export interface DetailedMovieResponse extends MovieResponse {
  openingCrawl: string;
  director: string;
  producer: string;
  characters: string[];
  planets: string[];
  starships: string[];
}