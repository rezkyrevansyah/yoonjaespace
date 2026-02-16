"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"

interface Column<T> {
  key: string
  label: string
  className?: string
  render?: (item: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  renderMobileCard?: (item: T) => ReactNode
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  renderMobileCard,
  emptyMessage = "Tidak ada data",
  className,
}: DataTableProps<T>) {
  const isMobile = useMobile()

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[#6B7280]">{emptyMessage}</p>
      </div>
    )
  }

  // Mobile: render card list
  if (isMobile && renderMobileCard) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(onRowClick && "cursor-pointer")}
          >
            {renderMobileCard(item)}
          </div>
        ))}
      </div>
    )
  }

  // Desktop: table
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[#E5E7EB]", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium text-[#6B7280]",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "border-b border-[#E5E7EB] last:border-b-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-[#F9FAFB]"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 text-[#111827]", col.className)}>
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
