"use client";

import { Film, Calendar, Search, Menu, X, User } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
// Підключи сюди функцію, яку ми створили в Кроці 1
import { checkIsLoggedIn } from "@/app/action/auth";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const status = await checkIsLoggedIn();
        setIsLoggedIn(status);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    }
    verifyAuth();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight text-[#F5F5F5]">
              Movie<span className="text-[#FF0033]">Ticket</span>
            </span>
          </Link>

          {/* Center: Navigation + Search */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center max-w-2xl">
            <Link
              href="/movies"
              className="flex items-center gap-2 text-gray-400 hover:text-[#F5F5F5] transition-colors shrink-0"
            >
              <Film className="w-4 h-4" />
              Movies
            </Link>
            

            {/* Search Bar */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] focus:shadow-[0_0_10px_rgba(255,0,51,0.3)] transition-all"
              />
            </div>
          </div>

          {/* Right: Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-3 shrink-0 min-w-[140px] justify-end">
            {!isLoading && (
              isLoggedIn ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-[#2a2a2a] hover:border-[#FF0033] text-[#F5F5F5] font-medium rounded-lg transition-all hover:shadow-[0_0_15px_rgba(255,0,51,0.2)]"
                >
                  <User className="w-4 h-4 text-[#FF0033]" />
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="px-4 py-2 text-[#F5F5F5] font-medium hover:text-[#FF0033] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth"
                    className="px-5 py-2 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-medium rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#F5F5F5]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#121212] border-t border-[#2a2a2a]">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-2 bg-[#050505] border border-[#2a2a2a] rounded-lg text-[#F5F5F5] text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FF0033] transition-all"
              />
            </div>

            <Link
              href="/movies"
              className="flex items-center gap-2 text-gray-400 hover:text-[#F5F5F5] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Film className="w-4 h-4" />
              Movies
            </Link>
           

            <div className="pt-2 border-t border-[#2a2a2a]">
              {!isLoading && (
                isLoggedIn ? (
                  <Link
                    href="/profile"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#FF0033]/10 border border-[#FF0033]/30 text-[#F5F5F5] font-medium rounded-lg hover:bg-[#FF0033]/20 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5 text-[#FF0033]" />
                    My Profile
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/auth"
                      className="flex-1 px-4 py-2 border border-[#2a2a2a] text-[#F5F5F5] font-medium rounded-lg hover:border-[#FF0033] transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/auth"
                      className="flex-1 px-4 py-2 bg-[#FF0033] hover:bg-[#CC0029] text-[#F5F5F5] font-medium rounded-lg transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}