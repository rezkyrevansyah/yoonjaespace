/**
 * Commission Period Utilities
 *
 * Commission period runs from 26th of previous month to 25th of current month.
 * This aligns with typical payroll cycles where payments are processed at month-end.
 */

export interface CommissionPeriod {
  startDate: Date
  endDate: Date
}

/**
 * Get commission period for a given month/year
 * Period: 26th of previous month → 25th of current month (inclusive)
 *
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2026)
 * @returns Object with startDate and endDate
 *
 * @example
 * // January 2026 commission period
 * getCommissionPeriod(1, 2026)
 * // Returns: { startDate: Dec 26, 2025 00:00, endDate: Jan 26, 2026 00:00 }
 */
export function getCommissionPeriod(month: number, year: number): CommissionPeriod {
  // Start date: 26th of previous month at 00:00:00
  let startMonth = month - 2 // month-1 for zero-indexed, then -1 for previous month
  let startYear = year

  // Handle January (starts from December 26 of previous year)
  if (month === 1) {
    startMonth = 11 // December (zero-indexed)
    startYear = year - 1
  }

  const startDate = new Date(startYear, startMonth, 26, 0, 0, 0, 0)

  // End date: 26th of current month at 00:00:00 (exclusive)
  // This means we include everything up to 25th 23:59:59
  const endDate = new Date(year, month - 1, 26, 0, 0, 0, 0)

  return { startDate, endDate }
}

/**
 * Format commission period as human-readable string
 *
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2026)
 * @returns Formatted period string (e.g., "26 Des 2025 - 25 Jan 2026")
 */
export function formatCommissionPeriod(month: number, year: number): string {
  const { startDate, endDate } = getCommissionPeriod(month, year)

  // Format start date
  const startStr = startDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // End date is exclusive, so display day before (25th)
  const displayEndDate = new Date(endDate.getTime() - 1) // Go back 1ms to get 25th
  const endStr = displayEndDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return `${startStr} - ${endStr}`
}

/**
 * Get the current commission period based on today's date
 *
 * @returns Object with month, year, and period dates
 */
export function getCurrentCommissionPeriod() {
  const today = new Date()
  const currentDay = today.getDate()

  let month = today.getMonth() + 1 // Convert to 1-12
  let year = today.getFullYear()

  // If we're on or after the 26th, we're in next month's commission period
  if (currentDay >= 26) {
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  const { startDate, endDate } = getCommissionPeriod(month, year)

  return {
    month,
    year,
    startDate,
    endDate,
    periodString: formatCommissionPeriod(month, year)
  }
}
