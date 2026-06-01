"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Імпортуємо наші серверні дії (переконайся, що шлях правильний)
import { loginAction, registerAction } from "@/app/action/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Стани для роботи з API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === "register") {
        // Базова перевірка паролів на фронтенді
        if (password !== confirmPassword) {
          setError("Паролі не співпадають");
          setIsLoading(false);
          return;
        }

        const result = await registerAction({ username: nickname, email, password });

        if (result.success) {
          setSuccessMsg("Реєстрація успішна! Тепер ви можете увійти.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        } else {
          setError(result.error || "Помилка реєстрації");
        }
      } else {
        // Логіка для входу
        const result = await loginAction({ email, password });

        if (result.success) {
          // Якщо успішно, кидаємо в профіль і оновлюємо роутер
          const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";
          sessionStorage.removeItem("redirectAfterLogin"); // очищаємо, щоб не спрацювало некст разу
          router.push(redirectTo);

          router.refresh();
        } else {
          setError(result.error || "Невірний email або пароль");
        }
      }
    } catch (err) {
      setError("Щось пішло не так. Перевірте з'єднання з сервером.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background animated gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF0033]/5 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Back to Home */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-[#F5F5F5] transition-colors z-10">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Home</span>
      </Link>

      {/* Auth Card with Breathing Glow */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF0033]/50 via-[#FF0033]/30 to-[#FF0033]/50 blur-xl"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">
              Movie<span className="text-[#FF0033]">Ticket</span>
            </h1>
          </div>

          <div className="relative flex bg-[#121212] rounded-lg p-1 mb-6">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#FF0033] rounded-md"
              animate={{ x: mode === "login" ? 0 : "calc(100% + 8px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md relative z-10 transition-colors ${mode === "login" ? "text-[#F5F5F5]" : "text-gray-400"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md relative z-10 transition-colors ${mode === "register" ? "text-[#F5F5F5]" : "text-gray-400"}`}
            >
              Register
            </button>
          </div>

          {/* Блок для відображення помилок або успіху */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
                {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm text-center">
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {mode === "register" && (
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF0033] transition-colors" />
                    <input
                      type="text"
                      placeholder="Nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_15px_rgba(255,0,51,0.3)] transition-all"
                    />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF0033] transition-colors" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_15px_rgba(255,0,51,0.3)] transition-all"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF0033] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_15px_rgba(255,0,51,0.3)] transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F5F5F5] transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {mode === "register" && (
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF0033] transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_15px_rgba(255,0,51,0.3)] transition-all"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#F5F5F5] transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                {mode === "login" && (
                  <div className="text-right">
                    <Link href="#" className="text-sm text-gray-400 hover:text-[#FF0033] transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 ${isLoading ? 'bg-[#CC0029] opacity-70' : 'bg-[#FF0033] hover:bg-[#CC0029]'} text-[#F5F5F5] font-semibold rounded-lg transition-colors relative overflow-hidden group`}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  <span className="relative z-10">
                    {isLoading ? "Processing..." : (mode === "login" ? "Access Account" : "Create Account")}
                  </span>
                  {!isLoading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-[#2a2a2a] flex justify-center gap-6">
            <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}