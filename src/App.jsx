import { useState, useEffect } from 'react'
import {useDebounce} from "react-use";
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Search from './components/search.jsx'
import Spinner from './components/spinner.jsx'
import MovieCard from "./components/MovieCard.jsx";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
}


const genres = [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 27, name: "Horror" },
    { id: 878, name: "Sci-Fi" },
    { id: 10749, name: "Romance" },
];

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    useDebounce(()=> setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedGenre, setSelectedGenre] = useState(null);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : selectedGenre
                    ? `${API_BASE_URL}/discover/movie?with_genres=${selectedGenre}`
                    : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS)

            if (!response.ok) {
                throw new Error('Failed to fetch movies')
            }

            const data = await response.json();

            if (!data.results) {
                setErrorMessage('Failed to fetch movies');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if(query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }

        } catch (error) {
            console.error(`Error fetching movies for ${error}`);
            setErrorMessage('Something went wrong. Please try again later.');

        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.error(`Error fetching trending movies for ${error}`);

        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm, selectedGenre])

    useEffect(() => {
        loadTrendingMovies()
    }, [])

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src='./hero-img.png' alt="heroBanner" />
          <h1>Find <span className= "text-gradient">Movies</span> You Will Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="genres">
                {genres.map((genre) => (
                    <button
                        key={genre.id}
                        onClick={() =>
                            setSelectedGenre(
                                selectedGenre === genre.id ? null : genre.id
                            )
                        }
                        className={`genre-btn ${
                            selectedGenre === genre.id ? 'active' : ''
                        }`}
                    >
                        {genre.name}
                    </button>
                ))}
            </div>
        </header>

          {trendingMovies.length > 0 && (
              <section className="trending">
                  <h2>Trending Movies</h2>

                  <ul>
                      {trendingMovies.map((movie, index) => (
                          <li key={movie.$id}>
                              <p>{index + 1}</p>

                              <img
                                  src={movie.poster_url}
                                  alt={movie.title}
                              />

                              <h3>{movie.searchTerm}</h3>

                              <span>{movie.count} searches</span>
                          </li>
                      ))}
                  </ul>
              </section>
          )}

          <section className="all-movies">
              <h2>All Movies</h2>
              {isLoading ? (
                  <Spinner />
              ): errorMessage ?(
                  <p className="text-red-600">Error: {errorMessage}</p>
              ): (
                  <ul>
                      {movieList.map((movie) => (
                          <MovieCard
                              key={movie.id}
                              movie={movie}
                              onSelect={setSelectedMovie}
                          />
                          ))
                      }
                  </ul>
              )
              }
          </section>
      </div>



        {selectedMovie && (
            <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
                onClick={() => setSelectedMovie(null)}
            >
                <div
                    className="bg-dark-100 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={
                            selectedMovie.poster_path
                                ? `https://image.tmdb.org/t/p/w500/${selectedMovie.poster_path}`
                                : '/no-movie.png'
                        }
                        alt={selectedMovie.title}
                        className="w-full h-[400px] object-cover"
                    />

                    <div className="p-6">
                        <h2 className="text-3xl font-bold mb-3">
                            {selectedMovie.title}
                        </h2>

                        <div className="flex gap-3 text-gray-400 mb-4">
                <img src="star.svg" alt="star icon"/>
          <span>
              {selectedMovie.vote_average?.toFixed(1)}
          </span>

                            <span>
            {selectedMovie.release_date?.split('-')[0]}
          </span>

                            <span>
            {selectedMovie.original_language?.toUpperCase()}
          </span>
                        </div>

                        <p className="text-gray-300 leading-relaxed">
                            {selectedMovie.overview || 'No summary available.'}
                        </p>

                        <button
                            className="mt-6 bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg transition"
                            onClick={() => setSelectedMovie(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </main>
  )
}

export default App


