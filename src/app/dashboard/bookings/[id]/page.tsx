"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams, notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  User,
  Phone,
  Mail,
  Instagram,
  MapPin,
  FileText,
  CreditCard,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity,
  MessageCircle,
  Download,
  Share2,
  Copy,
  MoreHorizontal,
  Plus,
  XCircle,
  Link as LinkIcon,
  Search,
  RotateCcw,
  RefreshCw,
  Send,
  Users,
  Film,
  ChevronDown,
  ChevronRight,
  Package,
  Sparkles,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { PermissionGate } from "@/components/shared/permission-gate"
import { Modal } from "@/components/shared/modal"
import { useToast } from "@/lib/hooks/use-toast"
import { useBooking } from "@/lib/hooks/use-bookings"
import { useAddOnTemplates } from "@/lib/hooks/use-master-data"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiPatch, apiDelete, apiPost } from "@/lib/api-client"
import {
    BookingStatus,
    PaymentStatus,
    Booking,
    PrintOrder,
    PrintOrderStatus,
    AddOnTemplate
} from "@/lib/types"


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
  BOOKED: "Booked", // Legacy status, shouldn't appear in new bookings
  PAID: "Paid",
  SHOOT_DONE: "Shot",
  PHOTOS_DELIVERED: "Delivered",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { showToast } = useToast()
  const { user } = useAuth()

  const { booking, isLoading, isError, mutate } = useBooking(id)
  const { addOnTemplates } = useAddOnTemplates()

  const [isUpdating, setIsUpdating] = useState(false)
  const [updatingAction, setUpdatingAction] = useState<"PAID" | "UNPAID" | null>(null)
  const [photoLinkValue, setPhotoLinkValue] = useState("")
  const [selectedPhotosValue, setSelectedPhotosValue] = useState("")
  const [selectedPrintStatus, setSelectedPrintStatus] = useState<PrintOrderStatus | "">("")
  const [selectedBookingStatus, setSelectedBookingStatus] = useState<BookingStatus | "">("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false)
  const [selectedAddOnId, setSelectedAddOnId] = useState("")
  const [addOnQty, setAddOnQty] = useState(1)
  const [muaOverlapInfo, setMuaOverlapInfo] = useState<any>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  // SESI 13: Tab navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "progress" | "pricing">("overview")

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

  // Handlers
  const handleUpdateStatus = async (newStatus: BookingStatus) => {
    setIsUpdating(true)
    try {
        const res = await apiPatch(`/api/bookings/${id}/status`, { status: newStatus })
        if (res.error) throw new Error(res.error)
        mutate()
        showToast(`Status updated to ${newStatus}`, "success")
    } catch (error: any) {
        showToast(error.message, "error")
    } finally {
        setIsUpdating(false)
    }
  }

  const handleUpdatePayment = async (status: PaymentStatus) => {
      setIsUpdating(true)
      setUpdatingAction(status)
      try {
          const res = await apiPatch(`/api/bookings/${id}/status`, { paymentStatus: status })
          if (res.error) throw new Error(res.error)
          mutate()
          showToast(`Payment status updated to ${status}`, "success")
      } catch (error: any) {
           showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
          setUpdatingAction(null)
      }
  }

  const handleUpdatePrintOrder = async (data: Partial<PrintOrder>) => {
      setIsUpdating(true)
      try {
          const res = await apiPatch(`/api/bookings/${id}/print-order`, data)
          if (res.error) throw new Error(res.error)
          mutate()
          showToast("Print order updated", "success")
      } catch (error: any) {
          showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
      }
  }

  const handleUpdatePrintStatus = async (newStatus: PrintOrderStatus) => {
      handleUpdatePrintOrder({ status: newStatus })
  }

  const handleDeletePrintOrder = async () => {
      setIsUpdating(true)
      try {
          const res = await apiDelete(`/api/bookings/${id}/print-order`)
          if (res.error) throw new Error(res.error)
          mutate()
          showToast("Print order cancelled successfully", "success")
      } catch (error: any) {
          showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
      }
  }

  const handleUpdatePhotoLink = async () => {
       setIsUpdating(true)
       try {
           const res = await apiPatch(`/api/bookings/${id}/status`, { photoLink: photoLinkValue })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Photo link updated", "success")
       } catch (error: any) {
           showToast(error.message, "error")
       } finally {
        setIsUpdating(false)
       }
  }

  const handleDelete = async () => {
    try {
        const res = await apiDelete(`/api/bookings/${id}`)
        if (res.error) throw new Error(res.error)
        showToast("Booking deleted", "success")
        router.push("/dashboard/bookings")
    } catch (error: any) {
        showToast(error.message, "error")
    }
  }

  const handleAddAddOn = async () => {
       if (!selectedAddOnId) return
       const template = addOnTemplates.find(t => t.id === selectedAddOnId)
       if (!template) return
       const newItem = { itemName: template.name, quantity: addOnQty, unitPrice: template.defaultPrice }
       const currentAddOns = booking.addOns.map(ao => ({ itemName: ao.itemName, quantity: ao.quantity, unitPrice: ao.unitPrice }))
       const newAddOnsList = [...currentAddOns, newItem]
       try {
           const res = await apiPatch(`/api/bookings/${id}`, { addOns: newAddOnsList })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Add-on added", "success")
           setIsAddOnModalOpen(false)
           setSelectedAddOnId("")
           setAddOnQty(1)
       } catch (error: any) {
           showToast(error.message, "error")
       }
  }

  const handleRemoveAddOn = async (index: number) => {
       const currentAddOns = booking.addOns.map(ao => ({ itemName: ao.itemName, quantity: ao.quantity, unitPrice: ao.unitPrice }))
       currentAddOns.splice(index, 1)
       try {
           const res = await apiPatch(`/api/bookings/${id}`, { addOns: currentAddOns })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Add-on removed", "success")
       } catch (error: any) {
           showToast(error.message, "error")
       }
  }

  // SESI 13: Copy customer page link to clipboard
  const handleCopyCustomerLink = () => {
    const customerPageUrl = `${window.location.origin}/status/${booking.publicSlug}`
    navigator.clipboard.writeText(customerPageUrl)
      .then(() => {
        showToast("Link customer page berhasil disalin!", "success")
      })
      .catch(() => {
        showToast("Gagal menyalin link", "error")
      })
  }

  const packagePrice = booking.packagePrice || booking.package?.price || 0
  const addOnsTotal = booking.addOns?.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0) || 0
  const discount = booking.discountAmount || 0
  const subtotal = packagePrice + addOnsTotal

  const currentStepIndex = BOOKING_STEPS.indexOf(booking.status)
  const isCancelled = booking.status === "CANCELLED"

  // Helper: Get available status options based on current user role and booking status
  const getAvailableStatusOptions = () => {
    if (!user) return BOOKING_STEPS

    const role = user.role
    const currentStatus = booking.status

    // OWNER and ADMIN can change to any status
    if (role === 'OWNER' || role === 'ADMIN') {
      return BOOKING_STEPS
    }

    // PHOTOGRAPHER restrictions
    if (role === 'PHOTOGRAPHER') {
      // Cannot change from PAID status
      if (currentStatus === 'PAID') {
        return [currentStatus] // Only show current status, cannot change
      }
      // Can only change to SHOOT_DONE or PHOTOS_DELIVERED
      return BOOKING_STEPS.filter(s =>
        s === currentStatus || s === 'SHOOT_DONE' || s === 'PHOTOS_DELIVERED'
      )
    }

    // PACKAGING_STAFF can only change to PHOTOS_DELIVERED
    if (role === 'PACKAGING_STAFF') {
      return BOOKING_STEPS.filter(s =>
        s === currentStatus || s === 'PHOTOS_DELIVERED'
      )
    }

    // Default: only show current status
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
            {/* SESI 13: Share Customer Link Button */}
            <button
              onClick={handleCopyCustomerLink}
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
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all"
                title="Delete booking"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* SESI 13: Tab Navigation */}
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

      {/* ── MUA OVERLAP ALERT ── */}
      {muaOverlapInfo?.hasOverlap && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
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
                          <strong>{overlap.bookingCode}</strong> ({overlap.clientName}) - MUA: {formatDate(overlap.muaStartTime, 'HH:mm')} - {formatDate(overlap.sessionStartTime, 'HH:mm')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {muaOverlapInfo.myMuaOverlapsSessions?.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">MUA booking ini bertabrakan dengan sesi booking lain:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {muaOverlapInfo.myMuaOverlapsSessions.map((overlap: any) => (
                        <li key={overlap.id}>
                          <strong>{overlap.bookingCode}</strong> ({overlap.clientName}) - Sesi: {formatDate(overlap.sessionStartTime, 'HH:mm')} - {formatDate(overlap.sessionEndTime, 'HH:mm')}
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

      {/* ── MAIN GRID ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ═══ LEFT COLUMN ═══ */}
        <div className="flex-1 w-full space-y-5">

          {/* CLIENT CARD - OVERVIEW TAB */}
          <div className={cn(
            "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
            activeTab !== "overview" && "hidden"
          )}>
            <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-[#7A1F1F]" />
                </div>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Client</h2>
              </div>
              <Link
                href={`/dashboard/clients/${booking.client.id}`}
                className="text-xs text-[#7A1F1F] font-semibold hover:underline flex items-center gap-1"
              >
                View Profile <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#B85C5C] flex items-center justify-center text-white font-black text-lg shrink-0">
                  {booking.client.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 leading-tight">{booking.client.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <a
                      href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {booking.client.phone}
                    </a>
                    {booking.client.email && (
                      <a
                        href={`mailto:${booking.client.email}`}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {booking.client.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS & ACTIONS CARD - PROGRESS TAB */}
          <div className={cn(
            "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
            activeTab !== "progress" && "hidden"
          )}>
            <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-[#7A1F1F]" />
              </div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Progress & Actions</h2>
            </div>

            <div className="p-5 space-y-5">

              {/* Progress Stepper */}
              {!isCancelled ? (
                <div className="grid grid-cols-5 gap-2">
                  {availableStatusOptions.map((step, index) => {
                    const isCompleted = currentStepIndex > index
                    const isCurrent = currentStepIndex === index
                    const stepColors = [
                      { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500/10', text: 'text-blue-600' },
                      { bg: 'bg-green-500', border: 'border-green-500', ring: 'ring-green-500/10', text: 'text-green-600' },
                      { bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500/10', text: 'text-purple-600' },
                      { bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500/10', text: 'text-amber-600' },
                      { bg: 'bg-[#7A1F1F]', border: 'border-[#7A1F1F]', ring: 'ring-[#7A1F1F]/10', text: 'text-[#7A1F1F]' },
                    ]
                    const color = stepColors[index]
                    return (
                      <div key={step} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? `${color.bg} ${color.border}`
                            : isCurrent
                            ? `bg-white ${color.border} ring-4 ${color.ring}`
                            : "bg-white border-gray-200"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : (
                            <span className={`text-xs font-black ${isCurrent ? color.text : "text-gray-300"}`}>{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold leading-none text-center ${
                          isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                        }`}>
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 bg-red-50 rounded-xl border border-red-100">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
                </div>
              )}

              {/* Change Status Control */}
              {!isCancelled && (
                <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="relative flex-1">
                    <select
                      value={selectedBookingStatus || booking.status}
                      onChange={(e) => setSelectedBookingStatus(e.target.value as BookingStatus)}
                      className="w-full appearance-none bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      disabled={isUpdating || !canChangeStatus}
                    >
                      {availableStatusOptions.map((step) => (
                        <option key={step} value={step}>{STEP_LABELS[step]}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => {
                      const s = selectedBookingStatus || booking.status
                      if (s) handleUpdateStatus(s as BookingStatus)
                    }}
                    disabled={isUpdating || !canChangeStatus}
                    className="px-4 py-2.5 bg-[#7A1F1F] text-white rounded-lg text-sm font-bold hover:bg-[#601818] transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isUpdating ? <span className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving</span> : "Update"}
                  </button>
                </div>
              )}

              {/* Contextual Action Area */}
              {booking.status === "CLOSED" && (
                <div className="flex items-center justify-center gap-2 py-4 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-bold text-green-700">Order Completed</span>
                </div>
              )}

              {/* Photo Link Input (SHOOT_DONE and beyond) */}
              {(currentStepIndex >= 2 && !isCancelled) && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <Film className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Google Drive Link</span>
                  </div>
                  <div className="p-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Drive link here..."
                      value={photoLinkValue}
                      onChange={(e) => setPhotoLinkValue(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20 transition-all"
                    />
                    {booking.status !== "SHOOT_DONE" && (
                      <button
                        onClick={handleUpdatePhotoLink}
                        disabled={isUpdating}
                        className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Save
                      </button>
                    )}
                    {booking.status !== "SHOOT_DONE" && photoLinkValue && (
                      <a
                        href={photoLinkValue.startsWith('http') ? photoLinkValue : `https://${photoLinkValue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                        title="Open link"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="px-4 pb-2.5 text-[10px] text-gray-400 italic">Pastikan link bisa diakses publik (Anyone with the link)</p>
                </div>
              )}

              {/* Shoot Done → Deliver */}
              {booking.status === "SHOOT_DONE" && (
                <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Foto sudah siap?</p>
                    <p className="text-xs text-amber-600 mt-0.5">Masukkan link di atas, lalu klik Deliver.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!photoLinkValue) { showToast("Link Google Drive wajib diisi!", "warning"); return }
                      handleUpdatePhotoLink()
                      handleUpdateStatus("PHOTOS_DELIVERED")
                    }}
                    disabled={isUpdating}
                    className="shrink-0 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Deliver
                  </button>
                </div>
              )}

              {/* Photos Delivered → Print / Close */}
              {booking.status === "PHOTOS_DELIVERED" && (
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => handleUpdatePrintStatus('WAITING_CLIENT_SELECTION')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {booking.printOrder ? "Update Print" : "Start Print"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("CLOSED")}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Close Order
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* PRINT ORDER TRACKING (Conditional) - PROGRESS TAB */}
          {booking.printOrder && (
            <div className={cn(
              "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
              activeTab !== "progress" && "hidden"
            )}>
              <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                    <Printer className="h-3.5 w-3.5 text-[#7A1F1F]" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Print Order</h2>
                </div>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isUpdating}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Cancel print order"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Print Stepper */}
                <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const currentIdx = PRINT_STATUS_STEPS.findIndex(s => s.status === booking.printOrder?.status)
                    const printColors = [
                      { bg: 'bg-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500/10', text: 'text-indigo-600' },
                      { bg: 'bg-cyan-500', border: 'border-cyan-500', ring: 'ring-cyan-500/10', text: 'text-cyan-600' },
                      { bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-500/10', text: 'text-orange-600' },
                      { bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500/10', text: 'text-emerald-600' },
                      { bg: 'bg-pink-500', border: 'border-pink-500', ring: 'ring-pink-500/10', text: 'text-pink-600' },
                      { bg: 'bg-violet-500', border: 'border-violet-500', ring: 'ring-violet-500/10', text: 'text-violet-600' },
                      { bg: 'bg-[#7A1F1F]', border: 'border-[#7A1F1F]', ring: 'ring-[#7A1F1F]/10', text: 'text-[#7A1F1F]' },
                    ]
                    return PRINT_STATUS_STEPS.map((step, idx) => {
                      const isCompleted = currentIdx >= idx
                      const isCurrent = booking.printOrder?.status === step.status
                      const color = printColors[idx]
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isCompleted
                              ? `${color.bg} ${color.border}`
                              : isCurrent
                              ? `bg-white ${color.border} ring-4 ${color.ring}`
                              : "bg-white border-gray-200"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            ) : (
                              <span className={`text-[10px] font-black ${isCurrent ? color.text : "text-gray-300"}`}>{idx + 1}</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wide leading-none text-center ${
                            isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* Change Print Status */}
                <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="relative flex-1">
                    <select
                      value={selectedPrintStatus || booking.printOrder.status}
                      onChange={(e) => setSelectedPrintStatus(e.target.value as PrintOrderStatus)}
                      className="w-full appearance-none bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      disabled={isUpdating}
                    >
                      {PRINT_STATUS_STEPS.map((step) => (
                        <option key={step.status} value={step.status}>{step.label} — {step.status.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => {
                      const s = selectedPrintStatus || booking.printOrder?.status
                      if (s) handleUpdatePrintStatus(s as PrintOrderStatus)
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-[#7A1F1F] text-white rounded-lg text-sm font-bold hover:bg-[#601818] transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
                  >
                    {isUpdating ? "..." : "Update"}
                  </button>
                </div>

                {/* Print Details */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selected Photos / Link</label>
                      <button
                        onClick={() => handleUpdatePrintOrder({ selectedPhotos: selectedPhotosValue })}
                        disabled={isUpdating}
                        className="text-xs text-[#7A1F1F] font-bold hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                    <textarea
                      value={selectedPhotosValue}
                      onChange={(e) => setSelectedPhotosValue(e.target.value)}
                      placeholder="Paste link or list photo numbers..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A1F1F] min-h-[72px] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Vendor</p>
                      <p className="text-sm font-semibold text-gray-900">{booking.printOrder.vendorName || "—"}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tracking</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{booking.printOrder.trackingNumber || "Pending"}</p>
                      {booking.printOrder.courier && <p className="text-xs text-gray-400">{booking.printOrder.courier}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div className="hidden lg:block w-[340px] shrink-0">
          <div className="sticky top-24 space-y-5">

            {/* BOOKING DETAILS - OVERVIEW TAB */}
            <div className={cn(
              "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
              activeTab !== "overview" && "hidden"
            )}>
              <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#7A1F1F]" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Booking Details</h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatDate(booking.date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(booking.startTime, 'HH:mm')} – {formatDate(booking.endTime, 'HH:mm')}</p>
                  </div>
                </div>

                {/* Package */}
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Package</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.package?.name || "—"}</p>
                  </div>
                </div>

                {/* Custom Fields */}
                {booking.customFields && booking.customFields.length > 0 && (
                  <div className="space-y-3 pt-1 border-t border-gray-50">
                    {booking.customFields.map((cf) => (
                      <div key={cf.id}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{cf.field?.fieldName}</p>
                        <p className="text-sm text-gray-800">{cf.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs text-amber-900 leading-relaxed">{booking.notes}</p>
                  </div>
                )}
                {booking.internalNotes && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">Internal Notes</p>
                    <p className="text-xs text-blue-900 leading-relaxed">{booking.internalNotes}</p>
                  </div>
                )}

                {/* Handled By */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xs font-black text-gray-600 shrink-0">
                    {booking.handledBy?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Handled by</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.handledBy?.name || "Unassigned"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ADD-ONS - PRICING TAB */}
            <div className={cn(
              "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
              activeTab !== "pricing" && "hidden"
            )}>
              <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-[#7A1F1F]" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Add-ons</h3>
                </div>
                <button
                  onClick={() => setIsAddOnModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#7A1F1F]/10 text-[#7A1F1F] rounded-lg text-xs font-bold hover:bg-[#7A1F1F]/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              <div className="p-5">
                {booking.addOns && booking.addOns.length > 0 ? (
                  <div className="space-y-2">
                    {booking.addOns.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                          <p className="text-xs text-gray-400">{item.quantity}× {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                          <button
                            onClick={() => handleRemoveAddOn(idx)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-400 italic py-3">No add-ons added yet.</p>
                )}
              </div>
            </div>

            {/* PRICE SUMMARY - PRICING TAB */}
            <div className={cn(
              "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
              activeTab !== "pricing" && "hidden"
            )}>
              <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-[#7A1F1F]" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ringkasan Harga</h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Line Items */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{booking.package?.name || "Package"}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(packagePrice)}</span>
                  </div>
                  {booking.addOns && booking.addOns.length > 0 && (
                    <div className="pl-3 border-l-2 border-gray-100 space-y-1">
                      {booking.addOns.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-400">
                          <span>{item.itemName} ×{item.quantity}</span>
                          <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                </div>

                {/* Total Block */}
                <div className="rounded-xl bg-gradient-to-br from-[#7A1F1F] to-[#A83535] p-4">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm font-bold text-white/80">Total</span>
                    <span className="text-2xl font-black text-white">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    <span className="text-xs text-white/60">Payment</span>
                    <StatusBadge status={booking.paymentStatus} type="payment" />
                  </div>
                </div>

                {/* Payment Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdatePayment('PAID')}
                    disabled={booking.paymentStatus === 'PAID' || isUpdating}
                    className="py-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isUpdating && updatingAction === 'PAID' ? (
                      <div className="w-3 h-3 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
                    ) : <CheckCircle className="h-3 w-3" />}
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleUpdatePayment('UNPAID')}
                    disabled={booking.paymentStatus === 'UNPAID' || isUpdating}
                    className="py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isUpdating && updatingAction === 'UNPAID' ? (
                      <div className="w-3 h-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                    ) : <XCircle className="h-3 w-3" />}
                    Mark Unpaid
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── MOBILE BOTTOM CARDS ── */}
      <div className="lg:hidden mt-5 space-y-4">

        {/* Booking Details (mobile) - OVERVIEW TAB */}
        <div className={cn(
          "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
          activeTab !== "overview" && "hidden"
        )}>
          <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
              <CalendarCheck className="h-3.5 w-3.5 text-[#7A1F1F]" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Booking Details</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">{formatDate(booking.date)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(booking.startTime, 'HH:mm')} – {formatDate(booking.endTime, 'HH:mm')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Package</p>
                <p className="text-sm font-semibold text-gray-900">{booking.package?.name || "—"}</p>
              </div>
            </div>
            {booking.customFields && booking.customFields.length > 0 && (
              <div className="space-y-3 pt-1 border-t border-gray-50">
                {booking.customFields.map((cf) => (
                  <div key={cf.id}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{cf.field?.fieldName}</p>
                    <p className="text-sm text-gray-800">{cf.value}</p>
                  </div>
                ))}
              </div>
            )}
            {booking.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-xs text-amber-900 leading-relaxed">{booking.notes}</p>
              </div>
            )}
            {booking.internalNotes && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1">Internal Notes</p>
                <p className="text-xs text-blue-900 leading-relaxed">{booking.internalNotes}</p>
              </div>
            )}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xs font-black text-gray-600 shrink-0">
                {booking.handledBy?.name?.[0] || "?"}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Handled by</p>
                <p className="text-sm font-semibold text-gray-900">{booking.handledBy?.name || "Unassigned"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons (mobile) - PRICING TAB */}
        <div className={cn(
          "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
          activeTab !== "pricing" && "hidden"
        )}>
          <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-[#7A1F1F]" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Add-ons</h3>
            </div>
            <button
              onClick={() => setIsAddOnModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#7A1F1F]/10 text-[#7A1F1F] rounded-lg text-xs font-bold hover:bg-[#7A1F1F]/20 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <div className="p-5">
            {booking.addOns && booking.addOns.length > 0 ? (
              <div className="space-y-2">
                {booking.addOns.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-400">{item.quantity}× {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                      <button onClick={() => handleRemoveAddOn(idx)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 italic py-3">No add-ons added yet.</p>
            )}
          </div>
        </div>

        {/* Price Summary (mobile) - PRICING TAB */}
        <div className={cn(
          "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden",
          activeTab !== "pricing" && "hidden"
        )}>
          <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
              <CreditCard className="h-3.5 w-3.5 text-[#7A1F1F]" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ringkasan Harga</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{booking.package?.name || "Package"}</span>
                <span className="font-medium text-gray-900">{formatCurrency(packagePrice)}</span>
              </div>
              {booking.addOns && booking.addOns.length > 0 && (
                <div className="pl-3 border-l-2 border-gray-100 space-y-1">
                  {booking.addOns.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-400">
                      <span>{item.itemName} ×{item.quantity}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>−{formatCurrency(discount)}</span>
                </div>
              )}
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#7A1F1F] to-[#A83535] p-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-bold text-white/80">Total</span>
                <span className="text-2xl font-black text-white">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <span className="text-xs text-white/60">Payment</span>
                <StatusBadge status={booking.paymentStatus} type="payment" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdatePayment('PAID')}
                disabled={booking.paymentStatus === 'PAID' || isUpdating}
                className="py-2.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                {isUpdating && updatingAction === 'PAID' ? <div className="w-3 h-3 rounded-full border-2 border-green-700 border-t-transparent animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                Mark Paid
              </button>
              <button
                onClick={() => handleUpdatePayment('UNPAID')}
                disabled={booking.paymentStatus === 'UNPAID' || isUpdating}
                className="py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                {isUpdating && updatingAction === 'UNPAID' ? <div className="w-3 h-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin" /> : <XCircle className="h-3 w-3" />}
                Mark Unpaid
              </button>
            </div>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`/status/${booking.publicSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#7A1F1F] text-white rounded-xl text-sm font-bold shadow-sm"
          >
            <Activity className="h-4 w-4" />
            Customer Page
          </a>
          <a
            href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            WA Client
          </a>
        </div>
        <PermissionGate allowedRoles={["OWNER", "ADMIN"]}>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            Delete Booking
          </button>
        </PermissionGate>

      </div>

      {/* ── MODALS ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Print Order?"
        description="This will permanently delete the print order tracking data. Are you sure?"
        confirmLabel="Yes, Cancel"
        variant="danger"
        onConfirm={() => { handleDeletePrintOrder(); setCancelModalOpen(false) }}
      />

      <Modal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        title="Add Add-on Item"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Item</label>
            <select
              value={selectedAddOnId}
              onChange={(e) => setSelectedAddOnId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20"
            >
              <option value="">— Choose item —</option>
              {addOnTemplates?.map((t: AddOnTemplate) => (
                <option key={t.id} value={t.id}>{t.name} · {formatCurrency(t.defaultPrice)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={addOnQty}
              onChange={(e) => setAddOnQty(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setIsAddOnModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleAddAddOn} className="flex-1 py-2.5 bg-[#7A1F1F] text-white rounded-xl text-sm font-bold hover:bg-[#601818] transition-colors shadow-sm">Add Item</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
