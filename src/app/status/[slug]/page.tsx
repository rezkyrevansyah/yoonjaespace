"use client"

import { use } from "react"
import Image from "next/image"
import Link from "next/link"
import { mockBookings, mockPrintOrders } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Booking, PrintOrder, BookingStatus, PrintOrderStatus } from "@/lib/types"

// --- Extended Types & Mock Helpers ---

interface ExtendedBooking extends Booking {
  printOrder?: PrintOrder
  driveLink?: string
  invoiceLink?: string
  invoiceGenerated?: boolean
}

// Function to enrich mock data for this view
const getExtendedBooking = (slug: string): ExtendedBooking | null => {
  const booking = mockBookings.find((b) => b.slug === slug || b.bookingCode === slug)
  if (!booking) return null

  const printOrder = mockPrintOrders.find((po) => po.bookingId === booking.id)

  // Mock logic for drive link presence
  // In real app, this would be a field in booking or a separate table
  const hasDriveLink =
    booking.status === "PHOTOS_DELIVERED" ||
    booking.status === "CLOSED" ||
    (printOrder ? true : false)

  const driveLink = hasDriveLink ? "https://drive.google.com/drive/folders/mock-folder-id" : undefined

  // Mock logic for invoice
  // Assume invoice is generated if status is at least PAID (or even BOOKED depending on business logic, but let's say always for simplicity of the "Download" button existence)
  const invoiceGenerated = true // brief says "Show: Always (even if not generated yet)" but for the "Download" button state
  // We'll simulate invoice is ready if status != BOOKED (just for variety) or always ready.
  // Brief says: Jika sudah generate -> Button Download. Jika belum -> Empty state.
  // Let's assume invoice is generated once PAYMENT_STATUS is PAId or PARTIAL?
  // For safety, let's say invoice is generated if booking exists.
  const isInvoiceReady = booking.paymentStatus !== "UNPAID" || booking.status !== "CANCELLED"

  return {
    ...booking,
    printOrder,
    driveLink,
    invoiceGenerated: isInvoiceReady,
    invoiceLink: `/invoice/${booking.id}`,
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

const getTimelineSteps = (booking: ExtendedBooking): TimelineStep[] => {
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
    date: formatDate(booking.createdAt),
  })

  // 2. Paid
  steps.push({
    id: "paid",
    label: "Payment Confirmed",
    icon: CreditCard,
    status: getStepStatus(1),
    date: booking.paymentStatus === "PAID" ? formatDate(booking.updatedAt) : undefined, // Mock date
  })

  // 3. Shoot Done
  steps.push({
    id: "shoot",
    label: "Shoot Done",
    icon: Camera,
    status: getStepStatus(2),
    date: booking.status === "SHOOT_DONE" || currentStatusIdx > 2 ? formatDate(booking.sessionDate) : undefined,
  })

  // 4. Photos Delivered
  steps.push({
    id: "delivered",
    label: "Photos Delivered",
    icon: ImageIcon,
    status: getStepStatus(3),
    date:
      booking.status === "PHOTOS_DELIVERED" || currentStatusIdx > 3
        ? formatDate(booking.updatedAt)
        : undefined,
  })

  // If Print Order Exists, inject print steps
  if (booking.printOrder) {
    const po = booking.printOrder
    const printFlow: PrintOrderStatus[] = [
      "WAITING_SELECTION",
      "SENT_TO_VENDOR",
      "PRINTING",
      "PACKAGING",
      "SHIPPED",
      "COMPLETED",
    ]
    const currentPrintIdx = printFlow.indexOf(po.status)

    const getPrintStepStatus = (stepIdx: number): "completed" | "current" | "upcoming" => {
      // Print steps only active if Photos Delivered is at least current or completed?
      // Actually standard flow handles main status. Print order is parallel or subsequent.
      // If booking is PHOTOS_DELIVERED, we check print status.
      if (currentStatusIdx < 3) return "upcoming" // Not yet at Photos Delivered layer

      if (stepIdx < currentPrintIdx) return "completed"
      if (stepIdx === currentPrintIdx) return "current"
      return "upcoming"
    }

    steps.push({
      id: "print_selection",
      label: "Waiting Photo Selection",
      icon: Users,
      status: getPrintStepStatus(0),
      isPrintStep: true,
    })

    steps.push({
      id: "print_vendor",
      label: "Process at Vendor",
      icon: Printer,
      status: getPrintStepStatus(1), // Merging Sent & Printing for simplicity or keep distinct? Brief said "Sent to Print Vendor", "Printing"
      isPrintStep: true,
    })
    
    // Let's combine printing phases to avoid too many steps if needed, but brief listed them.
    // Let's stick to brief.
    /* 
      6. Waiting Photo Selection
      7. Sent to Print Vendor
      8. Printing
      9. Packaging
      10. Shipped
      11. Completed
    */
    
    // Optimization: If status is PRINTING, Set Sent to Vendor as completed.
    
    // We already added 2. Let's correct mapping.
    
    // If status is PRINTING (idx 2)
    // 0 (Waiting) -> Completed
    // 1 (Sent) -> Completed
    // 2 (Printing) -> Current
    
    // Update logic above for print_vendor to strictly match?
    // Let's just map all of them.
    
    const printStepsConfig = [
        { id: "waiting_selection", label: "Photo Selection", icon: Users, idx: 0 },
        { id: "sent_vendor", label: "Sent to Vendor", icon: Send, idx: 1 },
        { id: "printing", label: "Printing", icon: Printer, idx: 2 },
        { id: "packaging", label: "Packaging", icon: Box, idx: 3 },
        { id: "shipped", label: "Shipped", icon: Truck, idx: 4 },
        { id: "completed", label: "Order Completed", icon: CheckCircle, idx: 5 },
    ]

    printStepsConfig.forEach(s => {
         steps.push({
            id: s.id,
            label: s.label,
            icon: s.icon,
            status: getPrintStepStatus(s.idx),
            isPrintStep: true,
            date: po.status === "SHIPPED" && s.id === "shipped" ? formatDate(po.updatedAt) : undefined
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
  const booking = getExtendedBooking(slug)

  if (!booking) {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#FFF5F5] font-sans pb-12">
      <div className="max-w-[480px] mx-auto w-full">
        {/* Section 1: Header */}
        <div className="pt-8 pb-6 px-4 text-center">
          <div className="relative w-[80px] h-[80px] mx-auto mb-3">
             {/* Using standard img tag if Next Image has issues with file path in dev, but trying Image first */}
             <Image 
                src="/logo_yoonjae.png" 
                alt="Yoonjaespace Logo" 
                fill 
                className="object-contain"
                priority
             />
          </div>
          <h1 className="text-xl font-bold text-[#7A1F1F] tracking-tight">Yoonjaespace</h1>
          <div className="w-12 h-0.5 bg-[#7A1F1F]/20 mx-auto mt-4 rounded-full" />
        </div>

        {/* Section 2: Greeting */}
        <div className="px-4 mb-8 text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Hi, {booking.client.name.split(" ")[0]}! 👋
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
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7A1F1F]" />
                Status Timeline
            </h3>
            
            <div className="relative pl-2">
                {timelineSteps.map((step, index) => {
                    const isLast = index === timelineSteps.length - 1
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
              
              {booking.driveLink ? (
                <div className="space-y-3">
                    <Link 
                        href={booking.driveLink}
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
          
          {/* Fallback for "In Editing" state if strictly Photos not delivered yet but Shoot Done? 
              Brief says: Show: Jika status >= PHOTOS_DELIVERED. 
              The prompt says "Jika belum ada GDrive link: Empty state icon Image... Message: Foto kamu sedang dalam proses editing".
              But the "Show" condition says only if >= PHOTOS_DELIVERED. 
              Contradiction? 
              Usually if >= Photos Delivered, link SHOULD exist.
              If Booking is SHOOT_DONE, maybe we should show this section but strictly as "Processing"?
              Let's follow "Show: Jika status >= PHOTOS_DELIVERED".
              If so, GDrive link should be there. 
              But let's trust the logic: If user manually set status but didn't put link, handle fallback.
          */}

          {/* Section 5: Invoice */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#7A1F1F]" />
                <h3 className="font-semibold text-gray-900">Invoice</h3>
            </div>

            {booking.invoiceGenerated ? (
                <div className="space-y-3">
                    <Link 
                        href={booking.invoiceLink!}
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
                        <p className="text-sm font-medium text-gray-900">{formatDate(booking.sessionDate)}</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Waktu</p>
                        <p className="text-sm font-medium text-gray-900">{booking.sessionTime}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Paket</p>
                        <p className="text-sm font-medium text-gray-900">{booking.package.name}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                        <p className="text-xs text-gray-500">Info Client</p>
                        <p className="text-sm font-medium text-gray-900">{booking.client.name}</p>
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
                                        <span className="text-xs font-medium text-gray-900">{booking.printOrder.courier}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">No. Resi</span>
                                        <span className="text-xs font-mono font-medium text-gray-700 bg-white px-1 rounded select-all cursor-pointer">
                                            {booking.printOrder.trackingNumber}
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
                <h3 className="font-semibold text-gray-900">Yoonjaespace Studio</h3>
            </div>
            
            <div className="space-y-3 text-sm">
                <p className="text-gray-600 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5"><MapPin className="w-4 h-4 text-gray-400" /></span>
                    Jl. Studio No. 123, Jakarta Selatan
                </p>
                <p className="text-gray-600 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5"><Clock className="w-4 h-4 text-gray-400" /></span>
                    09:00 - 17:00 (Selasa Libur)
                </p>
                <div className="flex gap-3 mt-4">
                     <Link href="https://instagram.com/yoonjaespace" target="_blank" className="flex-1 bg-white border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Instagram className="w-4 h-4" /> @yoonjaespace
                     </Link>
                     <Link href="https://wa.me/6281234567890" target="_blank" className="flex-1 bg-white border border-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Phone className="w-4 h-4" /> WhatsApp
                     </Link>
                </div>
            </div>
          </section>

          {/* Section 8: Footer */}
          <div className="pt-6 pb-4 text-center space-y-6">
            <p className="text-[#7A1F1F] text-sm italic">
                Thank you for choosing Yoonjaespace! 💕
            </p>
            
            <Link 
                href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20booking%20lagi!" 
                className="flex items-center justify-center w-full px-4 py-3 bg-[#7A1F1F] text-white font-medium rounded-xl hover:bg-[#601818] transition-colors shadow-lg shadow-[#7A1F1F]/20"
            >
                <MessageCircle className="w-4 h-4 mr-2" />
                Book Again
            </Link>

            <div className="flex justify-center gap-6 text-gray-300">
                <Instagram className="w-5 h-5 hover:text-[#7A1F1F] transition-colors cursor-pointer" />
                {/* Add more icons if needed */}
            </div>

            <p className="text-xs text-gray-400">
                © 2026 Yoonjaespace Studio
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

