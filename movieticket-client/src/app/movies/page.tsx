"use client";

import { useState, useMemo, useEffect } from "react";
import { MovieCard } from "@/components/MovieCard";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Pagination } from "@/components/Pagination";

// 1. РОЗДІЛИМО URL: Базовий для картинок і API для запитів
const BASE_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

console.log(BACKEND_URL)
if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

interface Movie {
  id: string; 
  title: string;
  poster: string;
  sessions: string[];
  localization: 'DUB' | 'SUB';
}

// 2. ОНОВЛЕНИЙ ІНТЕРФЕЙС (додано moviePosterUrl)
interface SessionDto {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl: string; // Нове поле з бекенду
  hallId: string;
  hallName: string;
  startTime: string;
  price: number;
}

function getNextSevenDays() {
  const days = [];
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    days.push({
      id: i,
      label: i === 0 ? "Today" : dayNames[date.getDay()],
      date: `${day}.${month}`,
      fullDate: date.toISOString().split("T")[0],
    });
  }
  return days;
}

const ITEMS_PER_PAGE = 8;

export default function MoviesPage() {
  const dates = useMemo(() => getNextSevenDays(), []);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      setError(null);
      
      const targetDate = dates[selectedDateIndex].fullDate;

      try {
        const response = await fetch(`${BACKEND_URL}/session/by-date?date=${targetDate}`);
        
        if (!response.ok) throw new Error("Error loading schedule");
        
        const sessionsData: SessionDto[] = await response.json();

        const movieMap = new Map<string, Movie>();

        sessionsData.forEach((session) => {
          const timeString = new Date(session.startTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });

          if (!movieMap.has(session.movieId)) {
            // 3. ФОРМУЄМО ПОВНИЙ URL ДО ЗОБРАЖЕННЯ
            // Якщо постеру немає (null/empty), ставимо заглушку-плейсхолдер
            const fullPosterUrl = session.moviePosterUrl 
              ? `${BASE_SERVER_URL}${session.moviePosterUrl}` 
              : "https://via.placeholder.com/400x600?text=No+Poster";

            movieMap.set(session.movieId, {
              id: session.movieId,
              title: session.movieTitle,
              poster: fullPosterUrl, // Використовуємо наш згенерований URL
              localization: 'DUB',
              sessions: [timeString],
            });
          } else {
            movieMap.get(session.movieId)!.sessions.push(timeString);
          }
        });

        const groupedMovies = Array.from(movieMap.values()).map(movie => {
           movie.sessions.sort(); 
           return movie;
        });

        setMovies(groupedMovies);
      } catch (err: any) {
        setError(err.message || "Server error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSessions();
  }, [selectedDateIndex, dates]);

  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    return movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, movies]);

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMovies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMovies, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-8">Movie Schedule</h1>

          {/* Date Selector */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {dates.map((day) => (
              <button
                key={day.id}
                onClick={() => {
                  setSelectedDateIndex(day.id);
                  setCurrentPage(1);
                }}
                className={`flex flex-col items-center px-4 py-3 rounded-lg min-w-[80px] transition-all ${selectedDateIndex === day.id
                    ? "bg-[#FF0033] text-[#F5F5F5]"
                    : "bg-[#121212] text-gray-400 border border-[#2a2a2a] hover:border-[#FF0033] hover:text-[#FF0033]"
                  }`}
              >
                <span className="text-sm font-medium">{day.label}</span>
                <span className="text-xs mt-1 opacity-80">{day.date}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033]"
            />
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-[#FF0033] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : paginatedMovies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {paginatedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} selectedDate={dates[selectedDateIndex].fullDate} />
              ))}
            </div>
          ) : (
            <div className="texminute: '2-digit',t-center py-16 text-gray-400 text-lg">
              No sessions found for this date.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}