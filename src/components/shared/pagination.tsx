"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled
}: PaginationProps) {
  // If total pages is 0 or 1, we still render the structure but it's disabled
  const isSinglePage = totalPages <= 1
  const isDisabled = disabled || isSinglePage

  // Helper to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // If 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always include first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      // Logic for neighbors
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      // Always include last page
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className={cn("flex items-center justify-between pt-4 border-t border-[#E5E7EB]", isDisabled && "opacity-60 cursor-not-allowed")}>
      <p className="text-sm text-[#6B7280]">
        Halaman {Math.max(1, currentPage)} dari {Math.max(1, totalPages)}
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isDisabled || currentPage === 1}
          className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-[#9CA3AF]">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                disabled={isDisabled}
                className={cn(
                  "min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
                  page === currentPage
                    ? "bg-[#7A1F1F] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]",
                  isDisabled && "cursor-not-allowed"
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isDisabled || currentPage === totalPages}
          className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
