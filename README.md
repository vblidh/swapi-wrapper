# SWAPI Wrapper

This project is a backend service that interacts with the Star Wars API (SWAPI) and caches responses using Redis.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.

## Setup

1. Clone the repository:
    ```sh
    git clone git@github.com:vblidh/swapi-wrapper.git
    cd swapi-wrapper
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start Redis using Docker:
    ```sh
    docker run -p 6379:6379 -it redis/redis-stack-server:latest
    ```

4. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=3000
    SWAPI_URL=https://swapi.dev/api
    ```

5. Build the project:
    ```sh
    npm run build
    ```

6. Start the server:
    ```sh
    npm start
    ```

## Usage

The server will be running on `http://localhost:3000`. You can use the following endpoints:

- `GET /movies` - Fetches a list of movies.
- `GET /movies/:id` - Fetches details of a specific movie by ID.
- `GET /characters` - Fetches a list of characters.
- `GET /characters/:id` - Fetches details of a specific character by ID.

## Development

To start the server in development mode with hot-reloading:
```sh
npm run dev