"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Armchair, X, Check, QrCode, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const BACKEND_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

// Візуальні стилі та переваги (ціни тепер видалені звідси і підтягуються з БД)
const SEAT_TYPES = {
  standard: {
    label: "Standard",
    color: "bg-[#333333]",
    selectedColor: "bg-[#FF0033]",
    borderClass: "",
    perks: ["Comfortable seating", "Great sound"],
  },
  premium: {
    label: "Premium",
    color: "bg-[#444444]",
    selectedColor: "bg-[#FF0033]",
    borderClass: "ring-1 ring-[#FF0033]/50",
    perks: ["Ergonomic seats", "Perfect viewing angle", "Extra cushioning"],
  },
  vip: {
    label: "VIP Loge",
    color: "bg-[#555555]",
    selectedColor: "bg-[#FF0033]",
    borderClass: "ring-2 ring-[#FF0033] shadow-[0_0_10px_rgba(255,0,51,0.3)]",
    perks: ["Reclining seats", "Extra legroom", "Free popcorn & drinks", "Premium sound"],
  },
};

type SeatType = keyof typeof SEAT_TYPES;

interface Seat {
  id: string; // Справжній Guid з бази даних
  row: number;
  number: number;
  type: SeatType;
  price: number; // Динамічна ціна з бекенду
  isOccupied: boolean;
}

interface SessionDto {
  id: string;
  movieId: string;
  movieTitle: string;
  hallId: string;
  hallName: string;
  startTime: string;
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Стейти для даних з API
  const [sessionData, setSessionData] = useState<SessionDto | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Стейти взаємодії
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Завантаження розкладу та місць з API
  useEffect(() => {
    async function fetchHallData() {
      try {
        const [sessionRes, seatsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/session/${sessionId}`),
          fetch(`${BACKEND_URL}/session/${sessionId}/seats`)
        ]);

        if (!sessionRes.ok || !seatsRes.ok) throw new Error("Не вдалося завантажити дані залу");

        const sessionInfo = await sessionRes.json();
        const seatsApiData = await seatsRes.json();

        setSessionData(sessionInfo);

        const mappedSeats: Seat[] = seatsApiData.map((s: any) => {
          let seatType: SeatType = "standard";
          if (s.type === 1) seatType = "premium";
          if (s.type === 2) seatType = "vip";

          return {
            id: s.seatId,
            row: s.rowNumber,
            number: s.seatNumber,
            type: seatType,
            price: s.finalPrice,
            isOccupied: s.status === "Booked",
          };
        });

        setSeats(mappedSeats);
      } catch (err) {
        console.error("Помилка завантаження даних залу:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) fetchHallData();
  }, [sessionId]);

  // ДИНАМІЧНИЙ РОЗРАХУНОК ЦІН ДЛЯ ЛЕГЕНДИ
  const legendPrices = useMemo(() => {
    const prices = { standard: 150, premium: 195, vip: 240 }; // Заглушки на випадок порожнього масиву
    if (seats.length > 0) {
      const st = seats.find(s => s.type === "standard");
      const pr = seats.find(s => s.type === "premium");
      const vp = seats.find(s => s.type === "vip");
      
      if (st) prices.standard = st.price;
      if (pr) prices.premium = pr.price;
      if (vp) prices.vip = vp.price;
    }
    return prices;
  }, [seats]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.isOccupied) return;

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const isSeatSelected = (seatId: string) => {
    return selectedSeats.some((s) => s.id === seatId);
  };

  // Розрахунок загальної вартості на основі реальних цін з БД
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleCompletePurchase = async () => {
  if (selectedSeats.length === 0) return;
  setIsBooking(true);
  setBookingError(null);

  try {
    const bookingPromises = selectedSeats.map((seat) => {
      const bodyPayload = {
        sessionId: sessionId,
        seatId: seat.id
      };

      // КРИТИЧНА ЗМІНА: запит йде на наш локальний Next.js API route!
      // Браузер бачить рідний домен і автоматично віддає куки без проблем із CORS
      return fetch("/api/ticket/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });
    });

    const responses = await Promise.all(bookingPromises);

    for (const response of responses) {
      if (response.status === 401) {
        router.push("/auth");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Це місце вже хтось викупив або сталася помилка."
        );
      }
    }

    // Успіх!
    setShowSuccessModal(true);
    setSelectedSeats([]); 
    
  } catch (err: any) {
    console.error("Booking error:", err);
    setBookingError(err.message || "Сталася помилка при бронюванні.");
  } finally {
    setIsBooking(false);
  }
};

  // Групування місць по рядах
  const seatsByRow: Record<number, Seat[]> = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  // Форматування дати/часу з ISO рядка бекенду
  const displayDate = sessionData 
    ? new Date(sessionData.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : "May 21, 2026";
  const displayTime = sessionData
    ? new Date(sessionData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "18:00";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FF0033] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-md border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-[#F5F5F5] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="flex-1 text-center">
              <h1 className="text-[#F5F5F5] font-semibold text-sm sm:text-base truncate">
                {sessionData?.movieTitle}
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm">
                {displayDate} • {displayTime} • {sessionData?.hallName}
              </p>
            </div>
            <div className="w-16 sm:w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left: Hall Layout */}
            <div className="flex-1">
              {/* Screen */}
              <div className="mb-8 px-4">
                <div className="relative">
                  <div className="h-2 bg-gradient-to-r from-transparent via-[#FF0033] to-transparent rounded-full shadow-[0_0_20px_rgba(255,0,51,0.6)]" />
                  <p className="text-center text-gray-500 text-xs mt-2 uppercase tracking-widest">
                    Screen
                  </p>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="overflow-x-auto pb-4">
                <div className="min-w-[600px] px-4">
                  {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => {
                    const sortedSeats = rowSeats.sort((a, b) => a.number - b.number);
                    return (
                      <div key={rowNum} className="flex items-center gap-2 mb-2">
                        <span className="w-6 text-gray-500 text-xs font-medium text-right shrink-0">
                          {rowNum}
                        </span>

                        <div className="flex gap-1 flex-1 justify-center">
                          {sortedSeats.map((seat, index) => {
                            const seatConfig = SEAT_TYPES[seat.type];
                            const isSelected = isSeatSelected(seat.id);

                            // Динамічний прохід по центру (розраховується на основі довжини ряду)
                            const hasAisleAfter = index === Math.floor(sortedSeats.length / 2) - 1;

                            return (
                              <div key={seat.id} className={`flex ${hasAisleAfter ? "mr-4 sm:mr-6" : ""}`}>
                                <button
                                  onClick={() => handleSeatClick(seat)}
                                  disabled={seat.isOccupied}
                                  className={`
                                    w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg flex items-center justify-center transition-all
                                    ${seat.isOccupied
                                      ? "bg-[#1a1a1a] cursor-not-allowed opacity-40"
                                      : isSelected
                                        ? `${seatConfig.selectedColor} shadow-[0_0_12px_rgba(255,0,51,0.6)] scale-110`
                                        : `${seatConfig.color} ${seatConfig.borderClass} hover:scale-105 cursor-pointer`
                                    }
                                    ${seat.type === "vip" && !seat.isOccupied && !isSelected ? "w-8 h-8 sm:w-9 sm:h-9" : ""}
                                  `}
                                  aria-label={`Row ${seat.row}, Seat ${seat.number}, ${seatConfig.label}${seat.isOccupied ? ", Occupied" : ""}`}
                                >
                                  <Armchair 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      isSelected ? "text-white" : seat.isOccupied ? "text-gray-600" : "text-gray-300"
                                    }`} 
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <span className="w-6 text-gray-500 text-xs font-medium text-left shrink-0">
                          {rowNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend with Dynamic API Prices */}
              <div className="mt-6 p-4 bg-[#121212] border border-[#2a2a2a] rounded-xl">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Seat Types & Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(SEAT_TYPES).map(([key, config]) => {
                    // Дістаємо ціну з нашого просканованого об'єкту цін
                    const dynamicPrice = legendPrices[key as SeatType];

                    return (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-t-lg flex items-center justify-center ${config.color} ${config.borderClass}`}>
                            <Armchair className="w-5 h-5 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-[#F5F5F5] font-medium text-sm">{config.label}</p>
                            <p className="text-[#FF0033] font-bold">₴{dynamicPrice}</p>
                          </div>
                        </div>
                        <ul className="text-xs text-gray-400 space-y-1 ml-11">
                          {config.perks.map((perk) => (
                            <li key={perk} className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#FF0033]" />
                              {perk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* State Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-t-lg bg-[#333333] flex items-center justify-center">
                      <Armchair className="w-4 h-4 text-gray-300" />
                    </div>
                    <span className="text-gray-400 text-xs">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-t-lg bg-[#FF0033] shadow-[0_0_8px_rgba(255,0,51,0.5)] flex items-center justify-center">
                      <Armchair className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-400 text-xs">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-t-lg bg-[#1a1a1a] opacity-40 flex items-center justify-center">
                      <Armchair className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-400 text-xs">Occupied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Checkout Summary */}
            <div className="lg:w-80 shrink-0">
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-6 sticky top-24">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Booking Summary</h3>

                {selectedSeats.length > 0 ? (
                  <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
                    {selectedSeats
                      .sort((a, b) => a.row - b.row || a.number - b.number)
                      .map((seat) => (
                        <div key={seat.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                          <div>
                            <p className="text-[#F5F5F5] text-sm font-medium">
                              Row {seat.row}, Seat {seat.number}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {SEAT_TYPES[seat.type].label}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#F5F5F5] font-medium">
                              ₴{seat.price}
                            </span>
                            <button
                              onClick={() => handleSeatClick(seat)}
                              className="text-gray-500 hover:text-[#FF0033] transition-colors"
                              aria-label={`Remove seat Row ${seat.row}, Seat ${seat.number}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center mb-6">
                    <Armchair className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No seats selected</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Click on available seats to select them
                    </p>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-[#2a2a2a] pt-4 mb-6">
                  <div className="flex justify-between text-gray-400 text-sm mb-2">
                    <span>Tickets</span>
                    <span>{selectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between text-[#F5F5F5] font-bold text-lg">
                    <span>Total</span>
                    <span>₴{totalPrice}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-500 text-center">
                    {bookingError}
                  </div>
                )}

                {/* Complete Purchase Button */}
                <button
                  onClick={handleCompletePurchase}
                  disabled={selectedSeats.length === 0 || isBooking}
                  className={`
                    w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2
                    ${selectedSeats.length > 0 && !isBooking
                      ? "bg-[#FF0033] hover:bg-[#CC0029] text-white shadow-[0_0_20px_rgba(255,0,51,0.4)] hover:shadow-[0_0_30px_rgba(255,0,51,0.6)]"
                      : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Purchase"}
                </button>

                <p className="text-gray-600 text-xs text-center mt-3">
                  By purchasing, you agree to our terms of service
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />

          <div className="relative bg-[#121212] border border-[#2a2a2a] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[#F5F5F5] transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="w-20 h-20 mx-auto mb-6 bg-[#FF0033]/20 rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-[#FF0033] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,0,51,0.5)]">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#F5F5F5] text-center mb-2">
              Purchase Successful!
            </h2>
            <p className="text-gray-400 text-center mb-6">
              Your tickets have been booked. Show this QR code at the cinema entrance.
            </p>

            {/* Складна Матриця QR-коду з твого дизайну */}
            <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
              <div className="w-40 h-40 bg-[#F5F5F5] rounded-lg flex items-center justify-center relative overflow-hidden">
                <QrCode className="w-32 h-32 text-[#121212]" />
                <div className="absolute inset-4 opacity-20">
                  <div className="grid grid-cols-8 gap-0.5 w-full h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.5 ? "bg-[#121212]" : "bg-transparent"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
              <div className="text-center mb-3">
                <p className="text-[#F5F5F5] font-semibold">{sessionData?.movieTitle}</p>
                <p className="text-gray-400 text-sm">
                  {displayDate} • {displayTime}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Seats</p>
                <p className="text-[#FF0033] font-medium truncate">
                  {selectedSeats
                    .sort((a, b) => a.row - b.row || a.number - b.number)
                    .map((s) => `Row ${s.row}, Seat ${s.number}`)
                    .join(" • ")}
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-[#FF0033] hover:bg-[#CC0029] text-white font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(255,0,51,0.3)]"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}