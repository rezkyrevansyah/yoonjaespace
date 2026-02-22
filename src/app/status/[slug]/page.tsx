"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
// We don't use the constant flow strictly because we need to inject print steps
import {
  CalendarCheck,
  CreditCard,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  Package,
  Users,
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  Truck,
  Printer,
  Box,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookingStatus, PrintOrderStatus, PaymentStatus } from "@/lib/types"

// --- Extended Types matching API Response ---

interface BookingData {
  id: string
  bookingCode: string
  clientName: string
  date: string
  startTime: string
  endTime: string
  packageName: string
  packageDuration: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  deliveredAt: string | null
  photoLink: string | null
  invoiceLink: string
  printOrder: {
    status: PrintOrderStatus
    courier: string | null
    trackingNumber: string | null
    shippedAt: string | null
  } | null
  studio: {
    name: string
    address: string
    phone: string
    whatsapp: string
    instagram: string
    operatingHours: any
    logoUrl?: string
    mapsUrl?: string
    studioPhotoUrl?: string
    footerText?: string
  }
}

// --- Timeline Logic ---

type TimelineStep = {
  id: string
  label: string
  icon: React.ElementType
  status: "completed" | "current" | "upcoming"
  date?: string
  isPrintStep?: boolean
}

const getTimelineSteps = (booking: BookingData): TimelineStep[] => {
  const steps: TimelineStep[] = []

  // Define base flow states for comparison
  const flow: BookingStatus[] = ["BOOKED", "PAID", "SHOOT_DONE", "PHOTOS_DELIVERED", "CLOSED"]
  const currentStatusIdx = flow.indexOf(booking.status)

  // Helper to determine status of a standard step
  const getStepStatus = (stepIdx: number): "completed" | "current" | "upcoming" => {
    if (booking.status === "CANCELLED") return "upcoming" // Handle cancelled separately if needed
    if (stepIdx < currentStatusIdx) return "completed"
    if (stepIdx === currentStatusIdx) return "current"
    return "upcoming"
  }

  // 1. Booked
  steps.push({
    id: "booked",
    label: "Booked",
    icon: CalendarCheck,
    status: getStepStatus(0),
    date: formatDate(booking.date), // Using booking date as proxy for created? No, API doesn't return created. Using session date?
    // Actually API doesn't return created. Let's use session date for Booked step is weird.
    // Ideally we want created date. I should add `createdAt` to API.
    // For now, let's omit date for Booked if not available, or use session date.
    // Let's use session date is misleading.
    // I'll update API to include createdAt if important, or just undefined.
    // Let's use undefined for now.
  })

  // 2. Paid
  steps.push({
    id: "paid",
    label: "Payment Confirmed",
    icon: CreditCard,
    status: getStepStatus(1),
    date: booking.paymentStatus === "PAID" ? undefined : undefined, // API missing payment date.
  })

  // 3. Shoot Done
  steps.push({
    id: "shoot",
    label: "Shoot Done",
    icon: Camera,
    status: getStepStatus(2),
    date: booking.status === "SHOOT_DONE" || currentStatusIdx > 2 ? formatDate(booking.date) : undefined,
  })

  // 4. Photos Delivered
  steps.push({
    id: "delivered",
    label: "Photos Delivered",
    icon: ImageIcon,
    status: getStepStatus(3),
    date:
      (booking.status === "PHOTOS_DELIVERED" || currentStatusIdx > 3) && booking.deliveredAt
        ? formatDate(booking.deliveredAt)
        : undefined,
  })

  // SESI 14: Simplified Print Order - Only show customer-relevant steps
  if (booking.printOrder) {
    const po = booking.printOrder

    // Simplified status mapping for customer view
    // Combine internal vendor steps into one "Printing in Progress" step
    const printStatusMap: Record<string, number> = {
        WAITING_CLIENT_SELECTION: 0,
        SENT_TO_VENDOR: 1,
        PRINTING_IN_PROGRESS: 1,  // Combined
        PRINT_RECEIVED: 1,         // Combined
        PACKAGING: 1,              // Combined
        SHIPPED: 2,
        COMPLETED: 3
    }

    const currentPrintIdx = printStatusMap[po.status] ?? 0

    const getPrintStepStatus = (stepIdx: number): "completed" | "current" | "upcoming" => {
      if (currentStatusIdx < 3 && booking.status !== 'PHOTOS_DELIVERED' && booking.status !== 'CLOSED') return "upcoming"

      if (stepIdx < currentPrintIdx) return "completed"
      if (stepIdx === currentPrintIdx) return "current"
      return "upcoming"
    }

    // SESI 14: Simplified print steps - remove internal vendor steps
    const printStepsConfig = [
        { id: "waiting_selection", label: "Photo Selection", icon: Users, idx: 0 },
        { id: "printing", label: "Printing in Progress", icon: Printer, idx: 1 },
        { id: "shipped", label: "Shipped", icon: Truck, idx: 2 },
        { id: "completed", label: "Order Completed", icon: CheckCircle, idx: 3 },
    ]

    printStepsConfig.forEach(s => {
         steps.push({
            id: s.id,
            label: s.label,
            icon: s.icon,
            status: getPrintStepStatus(s.idx),
            isPrintStep: true,
            date: po.status === "SHIPPED" && s.id === "shipped" && po.shippedAt ? formatDate(po.shippedAt) : undefined
         })
    })

  } else {
    // Standard Closed
    steps.push({
      id: "closed",
      label: "Closed",
      icon: CheckCircle,
      status: getStepStatus(4),
    })
  }

  return steps
}

export default function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // SESI 14: Collapsible timeline state
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)

  useEffect(() => {
    if (!slug) return
    
    // Fetch data
    const fetchData = async () => {
        try {
            const res = await fetch(`/api/status/${slug}`)
            if (!res.ok) throw new Error('Not found')
            const data = await res.json()
            setBooking(data)
        } catch (e) {
            setError(true)
        } finally {
            setLoading(false)
        }
    }
    
    fetchData()
  }, [slug])

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
      )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4 font-sans">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            Booking dengan kode tersebut tidak ditemukan. Pastikan link yang kamu buka benar.
          </p>
          <Link
            href="https://wa.me/6281234567890"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-[#7A1F1F] text-white font-medium rounded-xl hover:bg-[#601818] transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Us
          </Link>
        </div>
      </div>
    )
  }

  const timelineSteps = getTimelineSteps(booking)
  const startTime = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const endTime = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Invoice is always ready except when cancelled
  const isInvoiceReady = booking.status !== "CANCELLED"

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#FFF5F5] font-sans pb-12">
      <div className="max-w-[480px] mx-auto w-full">
        {/* Section 1: Header */}
        <div className="pt-8 pb-6 px-4 text-center">
          <div className="relative w-[80px] h-[80px] mx-auto mb-3 rounded-full ring-2 ring-[#7A1F1F]/10 ring-offset-4 overflow-hidden bg-white shadow-sm">
             <Image
                src={(booking.studio.logoUrl && booking.studio.logoUrl.trim() !== '') ? booking.studio.logoUrl : "/logo_yoonjae.png"}
                alt="Yoonjaespace Logo"
                fill
                className="object-cover rounded-full"
                priority
             />
          </div>
          <h1 className="text-xl font-bold text-[#7A1F1F] tracking-tight">{booking.studio.name}</h1>
          <div className="w-12 h-0.5 bg-[#7A1F1F]/20 mx-auto mt-4 rounded-full" />
        </div>

        {/* Section 2: Greeting */}
        <div className="px-4 mb-8 text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Hi, {booking.clientName.split(" ")[0]}! 👋
          </h2>
          <div className="inline-block bg-gray-100 rounded-full px-3 py-1">
             <span className="font-mono text-sm font-medium text-gray-600 tracking-wide">
               {booking.bookingCode}
             </span>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Section 3: Status Timeline */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#7A1F1F]" />
                    Status Timeline
                </h3>
                <button
                    onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#7A1F1F] transition-colors"
                >
                    {isTimelineExpanded ? (
                        <>
                            <span>Collapse</span>
                            <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            <span>Expand</span>
                            <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            <div className="relative pl-2">
                {timelineSteps
                    .filter((step, index) => {
                        // When collapsed, only show current step
                        if (!isTimelineExpanded) {
                            return step.status === "current";
                        }
                        return true;
                    })
                    .map((step, index, filteredSteps) => {
                        const isLast = index === filteredSteps.length - 1
                        const isCompleted = step.status === "completed"
                        const isCurrent = step.status === "current"

                        return (
                            <div key={step.id} className="flex gap-4 relative pb-8 last:pb-0">
                                {/* Vertical Line */}
                                {!isLast && (
                                    <div className={cn(
                                        "absolute left-[11px] top-8 bottom-0 w-[2px]",
                                        isCompleted ? "bg-[#7A1F1F]" : "border-l-2 border-dashed border-gray-200 ml-[1px]"
                                    )} />
                                )}

                                {/* Icon Circle */}
                                <div className={cn(
                                    "relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-offset-2",
                                    isCompleted ? "bg-[#7A1F1F] text-white" :
                                    isCurrent ? "bg-white border-2 border-[#7A1F1F] text-[#7A1F1F] ring-2 ring-[#7A1F1F]/20 animate-pulse" :
                                    "bg-white border-2 border-gray-200 text-gray-300"
                                )}>
                                    <step.icon className="w-3.5 h-3.5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 -mt-1">
                                    <div className="flex justify-between items-start">
                                        <p className={cn(
                                            "text-sm font-medium",
                                            isCompleted || isCurrent ? "text-[#7A1F1F]" : "text-gray-400"
                                        )}>
                                            {step.label}
                                        </p>
                                        {step.date && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {step.date}
                                            </span>
                                        )}
                                    </div>
                                    {isCurrent && (
                                        <p className="text-xs text-[#7A1F1F]/80 mt-0.5 font-medium">
                                            Status saat ini
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>
          </section>

          {/* Section 4: Photo Delivery */}
          {(booking.status === "PHOTOS_DELIVERED" || booking.status === "CLOSED" || booking.printOrder) && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-[#7A1F1F]" />
                <h3 className="font-semibold text-gray-900">Your Photos</h3>
              </div>

              {booking.photoLink ? (
                <div className="space-y-3">
                    <Link
                        href={booking.photoLink.startsWith('http') ? booking.photoLink : `https://${booking.photoLink}`}
                        target="_blank"
                        className="flex items-center justify-center w-full px-4 py-3 bg-[#7A1F1F] text-white font-medium rounded-xl hover:bg-[#601818] transition-colors shadow-sm"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Your Photos
                    </Link>
                    <p className="text-xs text-green-600 text-center bg-green-50 py-2 rounded-lg border border-green-100">
                        ✨ Foto kamu sudah siap! Klik button di atas.
                    </p>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
                   <p className="text-sm text-gray-500">Foto sedang diproses upload...</p>
                </div>
              )}
            </section>
          )}

          {/* Thank You WhatsApp Button - Show when photos are delivered */}
          {(booking.status === "PHOTOS_DELIVERED" || booking.status === "CLOSED") && booking.photoLink && (
            <section className="bg-gradient-to-br from-[#FFF5F5] to-white rounded-2xl border border-[#7A1F1F]/10 p-5">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Love your photos? Share your happiness with us! 💕
                </p>
                <Link
                  href={`https://wa.me/${booking.studio.whatsapp?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Thank you for choosing ${booking.studio.name}! We hope you love your photos! 💕`)}`}
                  target="_blank"
                  className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-medium rounded-xl hover:from-[#20BA5A] hover:to-[#0F7A6B] transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Thank You Message
                </Link>
              </div>
            </section>
          )}

          {/* Section 5: Invoice */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#7A1F1F]" />
                <h3 className="font-semibold text-gray-900">Invoice</h3>
            </div>

            {isInvoiceReady ? (
                <div className="space-y-3">
                    <Link
                        href={booking.invoiceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-4 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                        Invoice tersedia untuk di-download.
                    </p>
                </div>
            ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                   <p className="text-sm text-gray-400 px-4">
                       Invoice akan tersedia setelah pembayaran dikonfirmasi.
                   </p>
                </div>
            )}
          </section>

          {/* Section 6: Booking Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
                <CalendarCheck className="w-5 h-5 text-[#7A1F1F]" />
                <h3 className="font-semibold text-gray-900">Booking Details</h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Tanggal</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(booking.date)}</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Waktu</p>
                        <p className="text-sm font-medium text-gray-900">{startTime} - {endTime}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Paket</p>
                        <p className="text-sm font-medium text-gray-900">{booking.packageName}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Info Client</p>
                        <p className="text-sm font-medium text-gray-900">{booking.clientName}</p>
                    </div>
                </div>

                {booking.printOrder && (
                     <div className="pt-3 mt-3 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Print Info</p>
                        <div className="bg-[#FFF5F5] rounded-lg p-3 space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Status</span>
                                <span className="text-xs font-bold text-[#7A1F1F] bg-white px-2 py-0.5 rounded border border-[#7A1F1F]/20">
                                    {booking.printOrder.status.replace(/_/g, " ")}
                                </span>
                             </div>
                             {booking.printOrder.status === "SHIPPED" && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> Kurir
                                        </span>
                                        <span className="text-xs font-medium text-gray-900">{booking.printOrder.courier || "-"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">No. Resi</span>
                                        <span className="text-xs font-mono font-medium text-gray-700 bg-white px-1 rounded select-all cursor-pointer">
                                            {booking.printOrder.trackingNumber || "-"}
                                        </span>
                                    </div>
                                </>
                             )}
                        </div>
                     </div>
                )}
            </div>
          </section>

          {/* Section 7: Studio Info */}
          <section className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">{booking.studio.name}</h3>
            </div>

            {/* Studio Photo */}
            {booking.studio.studioPhotoUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                <div className="relative w-full h-48">
                  <Image
                    src={booking.studio.studioPhotoUrl}
                    alt={`${booking.studio.name} Studio`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
                <p className="text-gray-600 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5"><MapPin className="w-4 h-4 text-gray-400" /></span>
                    {booking.studio.address}
                </p>
                <p className="text-gray-600 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5"><Clock className="w-4 h-4 text-gray-400" /></span>
                    {booking.studio.operatingHours?.open} - {booking.studio.operatingHours?.close}
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 mb-3">
                     <Link href={booking.studio.instagram || '#'} target="_blank" className="bg-white border border-gray-200 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Instagram className="w-4 h-4" /> Instagram
                     </Link>
                     <Link href={`https://wa.me/${booking.studio.whatsapp?.replace(/[^0-9]/g, "")}`} target="_blank" className="bg-white border border-gray-200 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-[#128C7E] hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm">
                        <Phone className="w-4 h-4" /> WhatsApp
                     </Link>
                </div>
                {booking.studio.mapsUrl && (
                     <Link 
                        href={booking.studio.mapsUrl} 
                        target="_blank" 
                        className="w-full bg-[#7A1F1F] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#601818] transition-all shadow-sm active:scale-[0.98]"
                     >
                        <Navigation className="w-4 h-4" /> Buka di Google Maps
                     </Link>
                )}
            </div>
          </section>

          {/* Section 8: Footer */}
          <div className="pt-6 pb-4 text-center space-y-6">
            <p className="text-[#7A1F1F] text-sm italic">
                {booking.studio.footerText || `Thank you for choosing ${booking.studio.name}! 💕`}
            </p>

            <Link
                href={`https://wa.me/${booking.studio.whatsapp?.replace(/[^0-9]/g, "")}?text=Halo%2C%20saya%20ingin%20booking%20lagi!`}
                className="flex items-center justify-center w-full px-4 py-3 bg-[#7A1F1F] text-white font-medium rounded-xl hover:bg-[#601818] transition-colors shadow-lg shadow-[#7A1F1F]/20"
            >
                <MessageCircle className="w-4 h-4 mr-2" />
                Book Again
            </Link>

            <div className="flex justify-center gap-6 text-gray-300">
                {booking.studio.instagram && (
                  <Link href={booking.studio.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-5 h-5 hover:text-[#7A1F1F] transition-colors cursor-pointer" />
                  </Link>
                )}
            </div>

            <p className="text-xs text-gray-400">
                © 2026 {booking.studio.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
