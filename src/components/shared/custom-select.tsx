"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  value: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative min-w-[180px]", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all",
          isOpen && "border-[#7A1F1F] ring-2 ring-[#7A1F1F]/20"
        )}
      >
        <span className={cn("block truncate", !selectedOption && "text-[#9CA3AF]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[#9CA3AF] transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center py-2 pl-3 pr-9 text-left text-sm hover:bg-[#F9FAFB]",
                option.value === value ? "bg-[#FFF5F5] text-[#7A1F1F] font-medium" : "text-[#111827]"
              )}
            >
              <span className="block truncate">{option.label}</span>
              {option.value === value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#7A1F1F]">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
