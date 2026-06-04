"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// 1. Формуємо базові URL
const BASE_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
console.log(BASE_SERVER_URL);
// Використовуємо NEXT_PUBLIC_BACKEND_URL, оскільки це клієнтський компонент, який робить fetch напряму
const BACKEND_API_URL = `${BASE_SERVER_URL}/api`;

console.log(BACKEND_API_URL)

if (!BACKEND_API_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}


// 2. Інтерфейси DTO (відповідно до того, що повертає бекенд)
interface SessionDto {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl: string | null;
  hallId: string;
  hallName: string;
  startTime: string;
  price: number;
}

// Внутрішній інтерфейс для рендеру компонента
interface Session {
  id: string; // Змінено на string, бо SessionId - це Guid
  title: string;
  poster: string;
  time: string;
  hall: string;
  localization: 'DUB' | 'SUB'; // Можеш додати логіку на бекенді пізніше
}

function SessionCard({ session }: { session: Session }) {
  const router = useRouter();

  const handleBookTicket = () => {
    // Перехід на бронювання конкретного сеансу
    router.push(`/booking/${session.id}`); 
  };

  const isDub = session.localization === 'DUB';

  return (
    <div className="flex flex-col h-full w-full min-w-[280px] sm:min-w-[300px] bg-[#121212] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#FF0033]/50 hover:shadow-[0_0_20px_rgba(255,0,51,0.15)] transition-all group">
      
      {/* Poster Section */}
      <div className="relative aspect-[2/3] shrink-0 overflow-hidden">
        <img
          src={session.poster}
          alt={session.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Фолбек, якщо картинка не завантажилась
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x600?text=No+Poster";
          }}
        />

        {/* Localization Badge */}
        {session.localization && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-bold rounded text-[#F5F5F5] tracking-wider ${
              isDub ? 'bg-[#FF0033]' : 'bg-[#333333]'
            }`}>
              {session.localization}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col grow">
        <h3 className="text-[#F5F5F5] font-semibold text-lg mb-4 line-clamp-1 group-hover:text-[#FF0033] transition-colors" title={session.title}>
          {session.title}
        </h3>

        {/* Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#FF0033]" />
            <span className="font-medium text-[#F5F5F5]">{session.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="line-clamp-1" title={session.hall}>{session.hall}</span>
          </div>
        </div>

        {/* Book Button */}
        <button 
          onClick={handleBookTicket}
          className="mt-auto w-full py-3 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-semibold rounded-lg transition-colors"
        >
          Book Ticket
        </button>
      </div>
    </div>
  );
}

export function UpcomingSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPopularSessions() {
      setIsLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`${BACKEND_API_URL}/session/by-date?date=${today}`);
        
        // Додаємо детальну перевірку статусу
        if (!response.ok) {
          // Якщо бекенд повертає 404 коли немає сеансів - просто робимо порожній список
          if (response.status === 404) {
             setSessions([]);
             setIsLoading(false);
             return;
          }
          
          // Читаємо текст помилки з бекенду (це дуже допоможе в дебазі)
          const errorText = await response.text();
          throw new Error(`Server Error ${response.status}: ${errorText}`);
        }

        const data: SessionDto[] = await response.json();
        const now = new Date();

        const mappedSessions: Session[] = data
          .map((dto) => {
            const sessionDate = new Date(dto.startTime);
            
            const fullPosterUrl = dto.moviePosterUrl 
              ? `${BASE_SERVER_URL}${dto.moviePosterUrl}` 
              : "https://via.placeholder.com/400x600?text=No+Poster";

            return {
              id: dto.id,
              title: dto.movieTitle,
              poster: fullPosterUrl,
              time: sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              hall: dto.hallName,
              localization: 'DUB' as const,
              _rawDate: sessionDate
            };
          })
          .filter(s => s._rawDate >= now)
          .sort((a, b) => a._rawDate.getTime() - b._rawDate.getTime())
          .slice(0, 10);

        setSessions(mappedSessions);
      } catch (err: any) {
        console.error("Error fetching popular sessions:", err);
        // Тепер на екрані і в консолі буде точна причина з бекенду
        setError(err.message || "Could not load popular sessions.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPopularSessions();
  }, []);

  return (
    <section id="sessions" className="py-16 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] mb-2">
            Upcoming Sessions
          </h2>
          <p className="text-gray-400">
            Showing the sessions over the next few hours - book your spot now
          </p>
        </div>

        {/* Content Area */}
        <div className="relative -mx-4 px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-[#FF0033] animate-spin" />
            </div>
          ) : error ? (
             <div className="text-center py-10 text-red-500 border border-red-500/20 rounded-xl bg-red-500/5">
                {error}
             </div>
          ) : sessions.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {sessions.map((session) => (
                <div key={session.id} className="snap-start flex">
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 bg-[#121212] border border-[#2a2a2a] rounded-xl">
               No upcoming sessions available for today. Check the full schedule!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}