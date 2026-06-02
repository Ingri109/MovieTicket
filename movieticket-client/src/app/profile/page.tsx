"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket, Settings, History, LogOut, Eye, EyeOff, X,
  Calendar, Clock, MapPin, User, Mail, CalendarDays,
  ChevronRight, QrCode, Loader2, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Імпорт дії логауту та отримання даних
import { logoutAction } from "@/app/action/auth";
import { getUserProfileAndTickets } from "@/app/action/profile";

const BASE_SERVER_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const BACKEND_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;
if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

type TabType = "tickets" | "settings" | "history";

interface ActiveTicket {
  id: string;
  movieTitle: string;
  posterUrl: string;
  date: string;
  time: string;
  hall: string;
  row: number;
  seat: number;
  seatType: string;
}

interface PurchaseHistoryItem {
  id: string;
  movieTitle: string;
  date: string;
  seats: number;
  totalPrice: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: number;
  isEmailConfirmed: boolean;
  avatarUrl: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("tickets");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ActiveTicket | null>(null);

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [activeTickets, setActiveTickets] = useState<ActiveTicket[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const result = await getUserProfileAndTickets();

        if (result.error === "Unauthorized") {
          await handleLogout();
          return;
        }

        if (!result.success || !result.profile || !result.tickets) {
          throw new Error("Failed to load data. Please try again later.");
        }

        const { profile, tickets } = result;

        setUserData({
          id: profile.id || profile.Id,
          name: profile.name || profile.Name,
          email: profile.email || profile.Email,
          role: profile.role || profile.Role,
          isEmailConfirmed: profile.isEmailConfirmed || profile.IsEmailConfirmed,
          avatarUrl: null,
        });

        const now = new Date();
        const active: ActiveTicket[] = [];
        const history: PurchaseHistoryItem[] = [];

        tickets.forEach((t: any) => {
          const rawStartTime = t.startTime || t.StartTime || t.sessionStartTime || t.SessionStartTime;
          const sessionDate = rawStartTime ? new Date(rawStartTime) : new Date();
          const isFuture = sessionDate >= now;

          // Отримуємо відносний шлях постера з бази та формуємо повний URL
          const rawPosterUrl = t.moviePosterUrl || t.MoviePosterUrl || t.posterUrl;
          const fullPosterUrl = rawPosterUrl
            ? `${BASE_SERVER_URL}${rawPosterUrl}`
            : "https://via.placeholder.com/300x450?text=No+Poster"; // Заглушка

          const ticketObj: ActiveTicket = {
            id: t.id || t.Id || t.ticketId || t.TicketId || "TKT-XXX",
            movieTitle: t.movieTitle || t.MovieTitle || "Unknown movie",
            posterUrl: fullPosterUrl, // Використовуємо згенерований URL
            date: sessionDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: sessionDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', hour12: false }), // Додав hour12: false для 24-годинного формату
            hall: t.hallName || t.HallName || "Main hall",
            row: t.rowNumber || t.RowNumber || t.row || t.Row || 0,
            seat: t.seatNumber || t.SeatNumber || t.seat || t.Seat || 0,
            seatType: (t.type === 2 || t.Type === 2 || t.seatType === 2) ? "VIP Loge"
              : (t.type === 1 || t.Type === 1 || t.seatType === 1) ? "Premium"
                : "Standard",
          };

          const price = t.price || t.Price || t.finalPrice || t.FinalPrice || 0;

          if (isFuture) {
            active.push(ticketObj);
          } else {
            history.push({
              id: ticketObj.id,
              movieTitle: ticketObj.movieTitle,
              date: ticketObj.date,
              seats: 1,
              totalPrice: price,
            });
          }
        });

        active.sort((a, b) => {
          const dateA = new Date(a.date.split('.').reverse().join('-') + 'T' + a.time);
          const dateB = new Date(b.date.split('.').reverse().join('-') + 'T' + b.time);
          return dateA.getTime() - dateB.getTime();
        });

        setActiveTickets(active);
        setPurchaseHistory(history);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleViewQR = (ticket: ActiveTicket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateSuccess(true);
    setOldPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordUpdateSuccess(false), 3000);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
    router.push("/auth");
  };

  const tabs = [
    { id: "tickets" as TabType, label: "My tickets", icon: Ticket },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
    { id: "history" as TabType, label: "Purchase history", icon: History },
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FF0033] animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-center">
              {error}
            </div>
          )}

          {/* User Header */}
          <div className="mb-8 p-6 bg-[#121212] border border-[#2a2a2a] rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-4 border-[#FF0033] shadow-[0_0_20px_rgba(255,0,51,0.4)] flex items-center justify-center overflow-hidden">
                  {userData?.avatarUrl ? (
                    <img src={userData.avatarUrl} alt={userData.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF0033] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#F5F5F5] rounded-full" />
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[#F5F5F5]">{userData?.name}</h1>
                  {userData?.role === 2 && (
                    <span className="px-2 py-0.5 bg-[#FF0033]/20 text-[#FF0033] text-xs rounded border border-[#FF0033]/30">ADMIN</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-400">
                  <span className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-4 h-4" />
                    {userData?.email}
                    {userData?.isEmailConfirmed ? (
                      <span title="Email confirmed" className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
                      </span>
                    ) : (
                      <span title="Email not confirmed" className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-500 ml-1" />
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-center sm:justify-start gap-2">
                    <CalendarDays className="w-4 h-4" />
                    System user
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 shrink-0">
              <nav className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4 sticky top-24">
                <ul className="space-y-2">
                  {tabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                            ? "bg-[#FF0033]/10 text-[#FF0033] border border-[#FF0033]/30"
                            : "text-gray-400 hover:text-[#F5F5F5] hover:bg-[#1a1a1a]"
                          }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                        {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#FF0033]/70 hover:text-[#FF0033] hover:bg-[#FF0033]/5 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Tab Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {/* Active Tickets Tab */}
                {activeTab === "tickets" && (
                  <motion.div
                    key="tickets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-6">Upcoming sessions</h2>

                    {activeTickets.length > 0 ? (
                      <div className="grid gap-4">
                        {activeTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="group relative bg-[#121212] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#FF0033]/50 hover:shadow-[0_0_30px_rgba(255,0,51,0.15)] transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row">
                              <div className="sm:w-32 h-40 sm:h-auto shrink-0">
                                <img src={ticket.posterUrl} alt={ticket.movieTitle} className="w-full h-full object-cover" />
                              </div>

                              <div className="flex-1 p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div>
                                    <h3 className="text-lg font-bold text-[#F5F5F5] mb-3">{ticket.movieTitle}</h3>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                      <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-4 h-4 text-[#FF0033]" />
                                        {ticket.date}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4 text-[#FF0033]" />
                                        {ticket.time}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-400">
                                        <MapPin className="w-4 h-4 text-[#FF0033]" />
                                        {ticket.hall}
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-400">
                                        <Ticket className="w-4 h-4 text-[#FF0033]" />
                                        Row {ticket.row}, Seat {ticket.seat}
                                      </div>
                                    </div>

                                    <span className="inline-block mt-3 px-3 py-1 bg-[#FF0033]/10 text-[#FF0033] text-xs font-medium rounded-full border border-[#FF0033]/30">
                                      {ticket.seatType}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleViewQR(ticket)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-medium rounded-xl transition-colors shrink-0"
                                  >
                                    <QrCode className="w-4 h-4" />
                                    Show QR
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#121212] border border-[#2a2a2a] rounded-2xl">
                        <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">You have no active tickets.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Account Settings Tab */}
                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-6">Security</h2>

                    <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4">Change password</h3>

                      <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Old password</label>
                          <div className="relative">
                            <input
                              type={showOldPassword ? "text" : "password"}
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_10px_rgba(255,0,51,0.2)] transition-all"
                              required
                            />
                            <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF0033]">
                              {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">New password</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_10px_rgba(255,0,51,0.2)] transition-all"
                              required
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF0033]">
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {passwordUpdateSuccess && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                            Password successfully changed!
                          </motion.div>
                        )}

                        <button type="submit" className="px-6 py-3 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-medium rounded-xl transition-colors">
                          Update password
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* Purchase History Tab */}
                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-[#F5F5F5] mb-6">Purchase history</h2>

                    <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                      <div className="hidden sm:grid grid-cols-4 gap-4 px-6 py-4 bg-[#0a0a0a] border-b border-[#2a2a2a] text-sm font-medium text-gray-400">
                        <span>Movie</span>
                        <span>Date</span>
                        <span>Tickets</span>
                        <span>Total</span>
                      </div>

                      <div className="divide-y divide-[#2a2a2a]">
                        {purchaseHistory.length > 0 ? (
                          purchaseHistory.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 px-6 py-4 hover:bg-[#1a1a1a] transition-colors">
                              <span className="text-[#F5F5F5] font-medium">
                                <span className="sm:hidden text-gray-400 text-sm">Movie: </span>{item.movieTitle}
                              </span>
                              <span className="text-gray-400">
                                <span className="sm:hidden text-gray-500 text-sm">Date: </span>{item.date}
                              </span>
                              <span className="text-gray-400">
                                <span className="sm:hidden text-gray-500 text-sm">Tickets: </span>{item.seats}
                              </span>
                              <span className="text-[#FF0033] font-semibold">
                                <span className="sm:hidden text-gray-500 text-sm font-normal">Total: </span>₴{item.totalPrice}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-6 py-8 text-center text-gray-500">
                            Purchase history is empty
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#121212] border border-[#2a2a2a] rounded-2xl p-6 shadow-[0_0_50px_rgba(255,0,51,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[#F5F5F5]">
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">{selectedTicket.movieTitle}</h3>
                <p className="text-gray-400 text-sm mb-6">{selectedTicket.date} о {selectedTicket.time}</p>

                <div className="relative mx-auto w-48 h-48 mb-6">
                  <div className="absolute inset-0 bg-[#FF0033]/20 blur-xl rounded-2xl" />
                  <div className="relative w-full h-full bg-[#F5F5F5] rounded-2xl p-4 flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`w-6 h-6 ${Math.random() > 0.5 ? "bg-[#050505]" : "bg-transparent"}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex justify-between text-gray-400">
                    <span>ID Квитка</span><span className="text-[#F5F5F5] font-mono">{selectedTicket.id.split("-")[0]}...</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Зал</span><span className="text-[#F5F5F5]">{selectedTicket.hall}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Місце</span><span className="text-[#F5F5F5]">Row {selectedTicket.row}, seat {selectedTicket.seat}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
                  <p className="text-xs text-gray-500">Show this QR code when entering the hall</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}