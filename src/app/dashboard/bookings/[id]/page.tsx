"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  User,
  Activity,
  CreditCard,
  MessageCircle,
  Copy,
  FileText,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { PermissionGate } from "@/components/shared/permission-gate"
import { useBooking } from "@/lib/hooks/use-bookings"
import { useAddOnTemplates } from "@/lib/hooks/use-master-data"
import { useAuth } from "@/lib/hooks/use-auth"
import {
    BookingStatus,
    PrintOrderStatus,
} from "@/lib/types"

import { useBookingActions } from "./components/useBookingActions"
import { OverviewTab } from "./components/OverviewTab"
import { ProgressTab } from "./components/ProgressTab"
import { PricingTab } from "./components/PricingTab"
import { BookingModals } from "./components/BookingModals"

const PRINT_STATUS_STEPS: { status: PrintOrderStatus; label: string }[] = [
  { status: "WAITING_CLIENT_SELECTION", label: "Selection" },
  { status: "SENT_TO_VENDOR", label: "Vendor" },
  { status: "PRINTING_IN_PROGRESS", label: "Printing" },
  { status: "PRINT_RECEIVED", label: "Received" },
  { status: "PACKAGING", label: "Packing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "COMPLETED", label: "Done" },
]

const BOOKING_STEPS: BookingStatus[] = ["PAID", "SHOOT_DONE", "PHOTOS_DELIVERED", "CLOSED"]

const STEP_LABELS: Record<BookingStatus, string> = {
  BOOKED: "Booked", 
  PAID: "Paid",
  SHOOT_DONE: "Shot",
  PHOTOS_DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

export default function BookingDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()

  const { booking, isLoading, isError, mutate } = useBooking(id)
  const { addOnTemplates } = useAddOnTemplates()

  const [photoLinkValue, setPhotoLinkValue] = useState("")
  const [selectedPhotosValue, setSelectedPhotosValue] = useState("")
  const [selectedPrintStatus, setSelectedPrintStatus] = useState<PrintOrderStatus | "">("")
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<BookingStatus | "">("")
  const [muaOverlapInfo, setMuaOverlapInfo] = useState<any>(null)
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "progress" | "pricing">("overview")

  const actions = useBookingActions(id, mutate, booking, addOnTemplates)

  useEffect(() => {
    if (booking) {
      if (booking.photoLink) setPhotoLinkValue(booking.photoLink)
      if (booking.printOrder?.selectedPhotos) setSelectedPhotosValue(booking.printOrder.selectedPhotos)

      // Fetch MUA overlap info
      fetch(`/api/bookings/${booking.id}/overlap`)
        .then(res => res.json())
        .then(data => setMuaOverlapInfo(data))
        .catch(err => console.error('Failed to fetch overlap info:', err))
    }
  }, [booking])

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-400">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#7A1F1F] animate-spin" />
      <p className="text-sm">Loading booking details...</p>
    </div>
  )
  if (isError || !booking) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-red-400">
      <AlertCircle className="h-10 w-10 opacity-50" />
      <p className="text-sm font-medium">Booking not found or failed to load.</p>
    </div>
  )

  const calculateDuration = (b: any) => {
    if (!b?.startTime || !b?.endTime) return 0;
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  const packagePrice = booking.packagePrice || booking.package?.price || 0
  const discount = booking.discountAmount || 0

  const currentStepIndex = BOOKING_STEPS.indexOf(booking.status)
  const isCancelled = booking.status === "CANCELLED"

  // Helper: Get available status options based on current user role and booking status
  const getAvailableStatusOptions = () => {
    if (!user) return BOOKING_STEPS

    const role = user.role
    const currentStatus = booking.status

    if (role === 'OWNER' || role === 'ADMIN') {
      return BOOKING_STEPS
    }

    if (role === 'PHOTOGRAPHER') {
      if (currentStatus === 'PAID') return [currentStatus]
      return BOOKING_STEPS.filter(s => s === currentStatus || s === 'SHOOT_DONE' || s === 'PHOTOS_DELIVERED')
    }

    if (role === 'PACKAGING_STAFF') {
      return BOOKING_STEPS.filter(s => s === currentStatus || s === 'PHOTOS_DELIVERED')
    }

    return [currentStatus]
  }

  const availableStatusOptions = getAvailableStatusOptions()
  const canChangeStatus = availableStatusOptions.length > 1

  return (
    <div className="pb-24 lg:pb-10">

      {/* ── HEADER ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/bookings"
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>Bookings</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-700 font-semibold font-mono">{booking.bookingCode}</span>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-mono text-gray-900 tracking-tight leading-none">
              {booking.bookingCode}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <StatusBadge status={booking.status} type="booking" />
              <StatusBadge status={booking.paymentStatus} type="payment" />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <a
              href={`/status/${booking.publicSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#7A1F1F] text-white rounded-xl text-sm font-semibold hover:bg-[#601818] transition-all shadow-sm"
            >
              <Activity className="h-3.5 w-3.5" />
              Customer Page
            </a>
            <button
              onClick={actions.handleCopyCustomerLink}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#7A1F1F] text-[#7A1F1F] rounded-xl text-sm font-semibold hover:bg-[#7A1F1F]/5 transition-all shadow-sm"
              title="Copy customer page link to clipboard"
            >
              <Copy className="h-3.5 w-3.5" />
              Share Link
            </button>
            <a
              href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WA Client
            </a>
            <Link
              href={`/invoice/${booking.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </Link>
            <PermissionGate allowedRoles={["OWNER", "ADMIN"]}>
              <button
                onClick={() => actions.setDeleteModalOpen(true)}
                className="p-2 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all"
                title="Delete booking"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-2 shadow-sm sticky top-0 z-40">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-[#7A1F1F] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "progress"
                ? "bg-[#7A1F1F] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "pricing"
                ? "bg-[#7A1F1F] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
          </button>
        </div>
      </div>

      {/* MUA OVERLAP ALERT */}
      {muaOverlapInfo?.hasOverlap && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ Tumpang Tindih Jadwal MUA Terdeteksi
              </h3>
              <div className="text-sm text-yellow-700 space-y-2">
                {muaOverlapInfo.muaOverlapsMySession?.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Booking lain dengan MUA bertabrakan dengan sesi ini:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {muaOverlapInfo.muaOverlapsMySession.map((overlap: any) => (
                        <li key={overlap.id}>
                          <strong>{overlap.bookingCode}</strong> ({overlap.clientName})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs italic mt-3 text-yellow-600">
                  💡 Space 2 (makeup area) dan Space 1 (studio) terpisah, jadi overlap ini diperbolehkan.
                  Pastikan untuk mengkomunikasikan jadwal dengan client agar tidak ada kebingungan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS CONTENT ── */}
      <div className="space-y-6">
        <div className={cn(activeTab !== "overview" && "hidden")}>
          <OverviewTab booking={booking} calculateDuration={calculateDuration} />
        </div>

        <div className={cn(activeTab !== "progress" && "hidden")}>
          <ProgressTab 
            booking={booking}
            currentStepIndex={currentStepIndex}
            isCancelled={isCancelled}
            availableStatusOptions={availableStatusOptions}
            canChangeStatus={canChangeStatus}
            isUpdating={actions.isUpdating}
            selectedBookingStatus={selectedBookingStatus}
            setSelectedBookingStatus={setSelectedBookingStatus}
            handleUpdateStatus={actions.handleUpdateStatus}
            photoLinkValue={photoLinkValue}
            setPhotoLinkValue={setPhotoLinkValue}
            handleUpdatePhotoLink={() => actions.handleUpdatePhotoLink(photoLinkValue)}
            handleUpdatePrintStatus={actions.handleUpdatePrintStatus}
            setCancelModalOpen={actions.setCancelModalOpen}
            selectedPrintStatus={selectedPrintStatus}
            setSelectedPrintStatus={setSelectedPrintStatus}
            selectedPhotosValue={selectedPhotosValue}
            setSelectedPhotosValue={setSelectedPhotosValue}
            handleUpdatePrintOrder={actions.handleUpdatePrintOrder}
            STEP_LABELS={STEP_LABELS}
            PRINT_STATUS_STEPS={PRINT_STATUS_STEPS}
            showToast={(msg, type) => {}} // dummy func for isolated errors
            user={user}
          />
        </div>

        <div className={cn(activeTab !== "pricing" && "hidden")}>
          <PricingTab
            booking={booking}
            packagePrice={packagePrice}
            discount={discount}
            setIsAddOnModalOpen={actions.setIsAddOnModalOpen}
            handleRemoveAddOn={actions.handleRemoveAddOn}
            handleUpdatePayment={actions.handleUpdatePayment}
            isUpdating={actions.isUpdating}
            updatingAction={actions.updatingAction}
          />
        </div>
      </div>

      <BookingModals {...actions} addOnTemplates={addOnTemplates} />
    </div>
  )
}

function ChevronRight(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
}
