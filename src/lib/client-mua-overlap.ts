import { Booking } from '@/lib/types'

/**
 * Client-side MUA overlap detection
 * This mirrors the server-side logic but works with client data
 */

export function hasMuaAddOn(booking: Booking): boolean {
  if (!booking.addOns || booking.addOns.length === 0) return false

  return booking.addOns.some(addon => {
    const name = addon.itemName.toLowerCase()
    return name.includes('mua') || name.includes('makeup') || name.includes('make up')
  })
}

export function getMuaStartTime(booking: Booking): Date | null {
  if (!hasMuaAddOn(booking)) return null

  const sessionStart = new Date(booking.startTime)
  const muaStart = new Date(sessionStart)
  muaStart.setHours(muaStart.getHours() - 1)
  return muaStart
}

export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Check if a booking has MUA overlap warning
 * Returns array of conflicting bookings
 */
export function getBookingMuaOverlaps(
  booking: Booking,
  allBookings: Booking[]
): {
  hasOverlap: boolean
  muaOverlapsMySession: Booking[]  // Other bookings whose MUA time conflicts with my session
  myMuaOverlapsSessions: Booking[] // Other bookings whose session conflicts with my MUA time
} {
  const bookingStart = new Date(booking.startTime)
  const bookingEnd = new Date(booking.endTime)
  const bookingMuaStart = getMuaStartTime(booking)

  const muaOverlapsMySession: Booking[] = []
  const myMuaOverlapsSessions: Booking[] = []

  for (const otherBooking of allBookings) {
    // Skip same booking
    if (otherBooking.id === booking.id) continue

    // Skip cancelled bookings
    if (otherBooking.status === 'CANCELLED') continue

    const otherStart = new Date(otherBooking.startTime)
    const otherEnd = new Date(otherBooking.endTime)
    const otherMuaStart = getMuaStartTime(otherBooking)

    // Check if other booking's MUA overlaps with my session
    if (otherMuaStart) {
      const otherMuaEnd = otherStart // MUA ends when session starts
      if (timeRangesOverlap(otherMuaStart, otherMuaEnd, bookingStart, bookingEnd)) {
        muaOverlapsMySession.push(otherBooking)
      }
    }

    // Check if my MUA overlaps with other booking's session
    if (bookingMuaStart) {
      const myMuaEnd = bookingStart // My MUA ends when my session starts
      if (timeRangesOverlap(bookingMuaStart, myMuaEnd, otherStart, otherEnd)) {
        myMuaOverlapsSessions.push(otherBooking)
      }
    }
  }

  return {
    hasOverlap: muaOverlapsMySession.length > 0 || myMuaOverlapsSessions.length > 0,
    muaOverlapsMySession,
    myMuaOverlapsSessions,
  }
}
