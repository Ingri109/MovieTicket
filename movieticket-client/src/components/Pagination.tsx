import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-gray-400 hover:text-[#F5F5F5] hover:border-[#FF0033]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2a2a2a] disabled:hover:text-gray-400"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="flex gap-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              currentPage === page
                ? "bg-[#FF0033] text-[#F5F5F5]"
                : "bg-[#121212] border border-[#2a2a2a] text-gray-400 hover:text-[#F5F5F5] hover:border-[#FF0033]/50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg text-gray-400 hover:text-[#F5F5F5] hover:border-[#FF0033]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2a2a2a] disabled:hover:text-gray-400"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}