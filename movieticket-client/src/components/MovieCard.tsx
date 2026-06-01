import { useRouter } from "next/navigation";

interface Movie {
    id: string;
    title: string;
    poster: string;
    sessions: string[];
    localization: 'DUB' | 'SUB';
}// У C# це Guid, тому string


export function MovieCard({ movie, selectedDate }: { movie: Movie, selectedDate: string }) {
    const router = useRouter();
    const displayedSessions = movie.sessions.slice(0, 3);
    const hasMoreSessions = movie.sessions.length > 3;

    const handleBuyTicket = () => {
        router.push(`/movie/${movie.id}?date=${selectedDate}`);
    };
    const isDub = movie.localization === 'DUB';

    return (
        <div
            onClick={handleBuyTicket}
            className="flex flex-col h-full bg-[#121212] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#FF0033]/50 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(255,0,51,0.15)] transition-all group">

            {/* Poster */}
            <div className="relative aspect-[2/3] shrink-0 overflow-hidden">
                <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Localization Badge DUB/SUB (Справа) */}
                <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded text-[#F5F5F5] tracking-wider ${isDub ? 'bg-[#FF0033]' : 'bg-[#333333]'
                        }`}>
                        {movie.localization}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col grow">
                <h3 className="text-[#F5F5F5] font-semibold text-lg mb-3 line-clamp-1">
                    {movie.title}
                </h3>

                {/* Session Pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                    {displayedSessions.map((session, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300 text-xs"
                        >
                            {session}
                        </span>
                    ))}
                </div>

                {/* More sessions indicator */}
                {hasMoreSessions ? (
                    <p className="text-gray-500 text-xs mb-4">+ {movie.sessions.length - 3} more times</p>
                ) : (
                    <div className="mb-4" />
                )}

                {/* Buy Ticket Button */}
                <button
                    onClick={handleBuyTicket}
                    className="mt-auto w-full py-3 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-semibold rounded-lg transition-colors"
                >
                    Buy Ticket
                </button>
            </div>
        </div>
    );
}