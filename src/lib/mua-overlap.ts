import { Booking } from '@prisma/client'

/**
 * Check if a booking has MUA add-on
 * MUA add-on is detected by checking if any add-on item name contains "MUA" or "makeup" (case insensitive)
 */
export function hasMuaAddOn(addOns: Array<{ itemName: string }>): boolean {
  if (!addOns || addOns.length === 0) return false

  return addOns.some(addon => {
    const name = addon.itemName.toLowerCase()
    return name.includes('mua') || name.includes('makeup') || name.includes('make up')
  })
}

/**
 * Calculate MUA start time (1 hour before session start time)
 */
export function calculateMuaStartTime(sessionStartTime: Date): Date {
  const muaStart = new Date(sessionStartTime)
  muaStart.setHours(muaStart.getHours() - 1)
  return muaStart
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Detect MUA overlap for a booking
 * Returns array of booking IDs that have MUA time conflicting with this booking's session time
 */
export function detectMuaOverlap(
  currentBooking: {
    id: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
  },
  allBookings: Array<{
    id: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
  }>
): string[] {
  const overlappingBookingIds: string[] = []

  for (const booking of allBookings) {
    // Skip same booking
    if (booking.id === currentBooking.id) continue

    // Skip if booking doesn't have MUA
    if (!booking.muaStartTime) continue

    // Check if other booking's MUA time (muaStartTime to startTime) overlaps with current booking's session time
    const muaEndTime = booking.startTime // MUA ends when session starts

    if (timeRangesOverlap(
      booking.muaStartTime,
      muaEndTime,
      currentBooking.startTime,
      currentBooking.endTime
    )) {
      overlappingBookingIds.push(booking.id)
    }
  }

  return overlappingBookingIds
}

/**
 * Detect if current booking's MUA overlaps with other bookings' sessions
 * Returns array of booking IDs whose sessions overlap with this booking's MUA time
 */
export function detectCurrentMuaOverlap(
  currentBooking: {
    id: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
  },
  allBookings: Array<{
    id: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
  }>
): string[] {
  // If current booking doesn't have MUA, no overlap
  if (!currentBooking.muaStartTime) return []

  const overlappingBookingIds: string[] = []
  const muaEndTime = currentBooking.startTime // MUA ends when session starts

  for (const booking of allBookings) {
    // Skip same booking
    if (booking.id === currentBooking.id) continue

    // Check if current booking's MUA time overlaps with other booking's session time
    if (timeRangesOverlap(
      currentBooking.muaStartTime,
      muaEndTime,
      booking.startTime,
      booking.endTime
    )) {
      overlappingBookingIds.push(booking.id)
    }
  }

  return overlappingBookingIds
}

/**
 * Get comprehensive overlap information for a booking
 */
export function getOverlapInfo(
  currentBooking: {
    id: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
  },
  allBookings: Array<{
    id: string
    bookingCode: string
    startTime: Date
    endTime: Date
    muaStartTime: Date | null
    client?: { name: string }
  }>
) {
  // Bookings whose MUA overlaps with current booking's session
  const muaOverlapsMySession = detectMuaOverlap(currentBooking, allBookings)

  // Bookings whose session overlaps with current booking's MUA
  const myMuaOverlapsSessions = detectCurrentMuaOverlap(currentBooking, allBookings)

  // Get detailed info
  const muaOverlapsMySessionDetails = allBookings
    .filter(b => muaOverlapsMySession.includes(b.id))
    .map(b => ({
      id: b.id,
      bookingCode: b.bookingCode,
      clientName: b.client?.name || 'Unknown',
      muaStartTime: b.muaStartTime,
      sessionStartTime: b.startTime,
    }))

  const myMuaOverlapsSessionsDetails = allBookings
    .filter(b => myMuaOverlapsSessions.includes(b.id))
    .map(b => ({
      id: b.id,
      bookingCode: b.bookingCode,
      clientName: b.client?.name || 'Unknown',
      sessionStartTime: b.startTime,
      sessionEndTime: b.endTime,
    }))

  return {
    hasOverlap: muaOverlapsMySession.length > 0 || myMuaOverlapsSessions.length > 0,
    muaOverlapsMySession: muaOverlapsMySessionDetails,
    myMuaOverlapsSessions: myMuaOverlapsSessionsDetails,
  }
}
