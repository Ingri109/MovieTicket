"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, Star, Users, ChevronRight, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const BASE_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

interface SessionDto {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl: string;
  hallId: string;
  hallName: string;
  startTime: string;
  price: number;
}

interface ProcessedSession {
  sessionId: string;
  time: string;
}

// Головний компонент з логікою (його ми обгорнемо в Suspense нижче)
function MovieDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const movieId = params.id as string;
  const initialDateFromUrl = searchParams.get("date"); // Читаємо ?date=2026-05-26 з URL

  const [sessionsData, setSessionsData] = useState<SessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // 1. Завантажуємо всі сеанси для цього фільму
  useEffect(() => {
    async function fetchMovieSessions() {
      if (!movieId) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/session/by-movie/${movieId}`);
        
        if (!response.ok) {
           if (response.status === 404) throw new Error("Movie or screenings not found");
           throw new Error("Error loading data");
        }

        const data: SessionDto[] = await response.json();
        setSessionsData(data);
      } catch (err: any) {
        setError(err.message || "Server error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovieSessions();
  }, [movieId]);

  // 2. Динамічно створюємо список дат тільки з тих днів, коли є сеанси
  const dates = useMemo(() => {
    if (sessionsData.length === 0) return [];

    const uniqueDateStrings = Array.from(
      new Set(sessionsData.map((session) => session.startTime.split("T")[0]))
    ).sort();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = new Date().toISOString().split("T")[0];
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    return uniqueDateStrings.map((dateStr, index) => {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");

      let label = dayNames[d.getDay()];
      if (dateStr === todayStr) label = "Today";
      else if (dateStr === tomorrowStr) label = "Tomorrow";

      return {
        id: index,
        label,
        date: `${day}.${month}`,
        fullDate: dateStr,
      };
    });
  }, [sessionsData]);

  // 3. Синхронізуємо обрану дату з URL (якщо вона там є і сеанси завантажились)
  useEffect(() => {
    if (dates.length > 0 && initialDateFromUrl) {
      const targetIndex = dates.findIndex(d => d.fullDate === initialDateFromUrl);
      if (targetIndex !== -1) {
        setSelectedDateIndex(targetIndex);
      }
    }
  }, [dates, initialDateFromUrl]);

  // 4. Отримуємо сеанси тільки на вибраний день і сортуємо їх по часу
  const selectedDate = dates.length > 0 ? dates[selectedDateIndex] : null;

  const availableSessions: ProcessedSession[] = useMemo(() => {
    if (!selectedDate) return [];
    return sessionsData
      .filter((session) => session.startTime.startsWith(selectedDate.fullDate))
      .map((session) => {
        const time = new Date(session.startTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
        return { sessionId: session.id, time };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [sessionsData, selectedDate]);

  // Тимчасові дані для візуалу (поки бекенд не віддає їх)
  const movieTitle = sessionsData.length > 0 ? sessionsData[0].movieTitle : "Loading...";
  
  // Формуємо реальний шлях до постеру
  const moviePoster = sessionsData.length > 0 && sessionsData[0].moviePosterUrl
    ? `${BASE_SERVER_URL}${sessionsData[0].moviePosterUrl}`
    : "https://via.placeholder.com/400x600?text=No+Poster"; 
  const dummySynopsis = "This captivating film tells an incredible story that you will remember for a long time. Get ready for an unforgettable experience!";

  const handleTimeSelect = (sessionId: string) => {
    router.push(`/booking/${sessionId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-12 h-12 text-[#FF0033] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-32 text-red-500 text-xl font-medium">{error}</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Poster */}
          <div className="relative w-full max-w-sm mx-auto lg:mx-0 shrink-0">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <img src={moviePoster} alt={movieTitle} className="w-full h-full object-cover" />
              
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className="px-3 py-1 bg-[#FF0033] text-white text-xs font-bold rounded shadow-lg">DUB</span>
              </div>
            </div>
          </div>

          {/* Right: Movie Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4 text-balance">
              {movieTitle}
            </h1>
            <p className="text-gray-400 leading-relaxed mb-6 text-pretty">
              {dummySynopsis}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-[#F5F5F5]">
                <Star className="w-5 h-5 fill-[#FF0033] text-[#FF0033]" />
                <span className="font-semibold">8.5</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>2h 10min</span>
              </div>
              <span className="px-2 py-0.5 border border-gray-600 text-gray-400 text-sm rounded">PG-13</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {["Action", "Drama", "Sci-Fi"].map((g) => (
                <span key={g} className="px-3 py-1 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-sm rounded-full">
                  {g}
                </span>
              ))}
            </div>

            {/* Schedule Selector */}
            <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-[#F5F5F5] font-semibold mb-4">Choose a session time</h3>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {dates.map((day, index) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDateIndex(index)}
                    className={`flex flex-col items-center px-4 py-3 rounded-lg min-w-[85px] transition-all ${
                      selectedDateIndex === index
                        ? "bg-[#FF0033] text-[#F5F5F5]"
                        : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#FF0033] hover:text-[#FF0033]"
                    }`}
                  >
                    <span className="text-sm font-medium">{day.label}</span>
                    <span className="text-xs mt-1 opacity-80">{day.date}</span>
                  </button>
                ))}
              </div>

              {availableSessions.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {availableSessions.map((session) => (
                    <button
                      key={session.sessionId}
                      onClick={() => handleTimeSelect(session.sessionId)}
                      className="px-5 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] font-medium transition-all hover:bg-[#FF0033] hover:border-[#FF0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.4)] group flex items-center gap-2"
                    >
                      <span>{session.time}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No sessions found for this date.</p>
              )}

              <p className="text-gray-500 text-xs mt-4">
                Click on the time to go to seat selection
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Експортуємо саму сторінку, де контент обгорнутий у Suspense
export default function MovieDetailsPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <Suspense fallback={
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-12 h-12 text-[#FF0033] animate-spin" />
          </div>
        }>
          <MovieDetailsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}