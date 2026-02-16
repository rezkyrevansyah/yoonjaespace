"use client"

import { useState, useMemo } from "react"
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
  MoreHorizontal,
  Plus,
  XCircle,
  Link as LinkIcon,
  Send,
  Camera,
  Package, // Conflict with lucid-react Package icon vs local type? Lucide usually exports Package icon.
  Users,
  Film
} from "lucide-react"
import {
  mockBookings,
  mockCurrentUser,
  mockPrintOrders,
  mockAddOns
} from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { PermissionGate } from "@/components/shared/permission-gate"
import { Modal } from "@/components/shared/modal"
import { useToast } from "@/lib/hooks/use-toast"
import { 
    BookingStatus, 
    PaymentStatus, 
    Booking, 
    PrintOrder,
    PrintOrderStatus 
} from "@/lib/types"

const PRINT_STATUS_STEPS: { status: PrintOrderStatus; label: string }[] = [
  { status: "WAITING_SELECTION", label: "Selection" },
  { status: "SENT_TO_VENDOR", label: "Vendor" },
  { status: "PRINTING", label: "Printing" },
  { status: "RECEIVED", label: "Received" },
  { status: "PACKAGING", label: "Packing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "COMPLETED", label: "Done" },
]

const BOOKING_STEPS: BookingStatus[] = ["BOOKED", "PAID", "SHOOT_DONE", "PHOTOS_DELIVERED", "CLOSED"]

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { showToast } = useToast()

  // 1. Initial Data
  const initialBooking = mockBookings.find((b) => b.id === id)
  const initialPrintOrder = mockPrintOrders.find(p => p.bookingId === id)

  if (!initialBooking) {
    notFound() // This will render the closest not-found.tsx
    return null
  }

  // 2. State for Mock Mutations
  const [booking, setBooking] = useState<Booking>(initialBooking)
  const [printOrder, setPrintOrder] = useState<PrintOrder | undefined>(initialPrintOrder)
  const [isUpdating, setIsUpdating] = useState(false)
  const [gdriveLink, setGdriveLink] = useState("")

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // Handlers
  const confirmDelete = () => {
    // Mock delete
    showToast(`Booking ${booking.bookingCode} has been deleted`, "success")
    router.push("/dashboard/bookings")
  }

  const confirmCancel = () => {
    setBooking(prev => ({ ...prev, status: "CANCELLED" }))
    setCancelModalOpen(false)
    showToast("Booking has been cancelled", "info")
  }

  const updateStatus = (newStatus: BookingStatus) => {
    setIsUpdating(true)
    setTimeout(() => {
        setBooking(prev => ({ ...prev, status: newStatus }))
        setIsUpdating(false)
    }, 500)
  }

  const togglePayment = () => {
      const newStatus = booking.paymentStatus === "PAID" ? "UNPAID" : "PAID"
      setBooking(prev => ({ 
          ...prev, 
          paymentStatus: newStatus,
          paidAmount: newStatus === "PAID" ? prev.totalPrice : 0
      }))
  }

  const updatePrintStatus = (newStatus: PrintOrderStatus) => {
      if (printOrder) {
          setPrintOrder({ ...printOrder, status: newStatus })
      }
  }

  // Add-ons Handlers (Mock)
  const handleRemoveAddon = (index: number) => {
    const newAddons = [...booking.addOns]
    newAddons.splice(index, 1)
    const newSubtotal = booking.package.price + newAddons.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const newTotal = newSubtotal - booking.discount

    setBooking(prev => ({
        ...prev,
        addOns: newAddons,
        subtotal: newSubtotal,
        totalPrice: newTotal,
        // Update paid amount if it was fully paid? for now simplistic
        paidAmount: prev.paymentStatus === "PAID" ? newTotal : prev.paidAmount
    }))
  }
  
  const handleAddMockAddon = () => {
      // Just adding a dummy random addon for demo
      const randomAddon = mockAddOns[Math.floor(Math.random() * mockAddOns.length)]
      const newAddons = [...booking.addOns, { addOn: randomAddon, quantity: 1, price: randomAddon.price }]
      
      const newSubtotal = booking.package.price + newAddons.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const newTotal = newSubtotal - booking.discount

      setBooking(prev => ({
        ...prev,
        addOns: newAddons,
        subtotal: newSubtotal,
        totalPrice: newTotal,
        paidAmount: prev.paymentStatus === "PAID" ? newTotal : prev.paidAmount
    }))
  }

  const outstanding = Math.max(0, booking.totalPrice - booking.paidAmount)

  return (
    <div className="pb-20 lg:pb-10 relative">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Top Row: Back link & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
             <div className="flex items-start gap-3">
                 <Link
                    href="/dashboard/bookings"
                    className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-mono text-gray-900 tracking-tight">{booking.bookingCode}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={booking.status} type="booking" />
                        <StatusBadge status={booking.paymentStatus} type="payment" />
                    </div>
                </div>
             </div>

             {/* Desktop Actions */}
             <div className="hidden lg:flex flex-wrap items-center gap-3">
                 <a
                    href={`/status/${booking.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg hover:bg-[#9B3333] text-sm font-medium transition-colors shadow-sm"
                 >
                    <Activity className="h-4 w-4" />
                    Customer Page
                 </a>
                 <a
                    href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                 >
                    <MessageCircle className="h-4 w-4" />
                    WA Client
                 </a>
                 <button
                    onClick={() => {
                      const link = `${window.location.origin}/status/${booking.slug}`
                      navigator.clipboard.writeText(link)
                      showToast("Status link copied to clipboard!", "success")
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                 >
                    <LinkIcon className="h-4 w-4" />
                    Copy Status
                 </button>
                 <Link 
                    href={`/invoice/${booking.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                 >
                    <FileText className="h-4 w-4" />
                    Invoice
                 </Link>
                 
                 <PermissionGate allowedRoles={["OWNER", "ADMIN"]}>
                    <button
                        onClick={() => showToast("Edit mode coming soon", "info")}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </button>
                    {booking.status !== "CANCELLED" && (
                         <button 
                            onClick={() => setCancelModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => setDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                 </PermissionGate>
             </div>
             
             {/* Mobile Actions Dropdown Trigger (Mock) */}
             <div className="lg:hidden ml-auto">
                 <button className="p-2 border rounded-lg bg-white">
                     <MoreHorizontal className="h-5 w-5 text-gray-600" />
                 </button>
             </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        <div className="flex-1 w-full space-y-8">

            {/* A. Client Info Card */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <User className="h-5 w-5 text-[#7A1F1F]" />
                    <h2 className="text-lg font-bold text-gray-900">Client Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                     <div>
                         <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Nama Client</label>
                         <p className="text-lg font-medium text-gray-900">{booking.client.name}</p>
                     </div>
                     <div>
                         <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Contact</label>
                         <div className="flex flex-col gap-2">
                             <a href={`https://wa.me/${booking.client.phone}`} target="_blank" className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 transition-colors w-fit">
                                 <Phone className="h-4 w-4" />
                                 {booking.client.phone}
                             </a>
                             {booking.client.email && (
                                <a href={`mailto:${booking.client.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors w-fit">
                                    <Mail className="h-4 w-4" />
                                    {booking.client.email}
                                </a>
                             )}
                              {booking.client.instagram && (
                                <a href={`https://instagram.com/${booking.client.instagram.replace('@','')}`} target="_blank" className="flex items-center gap-2 text-sm text-gray-700 hover:text-pink-600 transition-colors w-fit">
                                    <Instagram className="h-4 w-4" />
                                    {booking.client.instagram}
                                </a>
                             )}
                         </div>
                     </div>
                     {booking.client.address && (
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Alamat</label>
                            <p className="text-sm text-gray-700">{booking.client.address}</p>
                        </div>
                     )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50">
                    <Link
                        href={`/dashboard/clients/${booking.client.id}`}
                        className="text-sm text-[#7A1F1F] font-medium hover:underline flex items-center gap-1"
                    >
                        Lihat Profil Client <ArrowLeft className="h-3 w-3 rotate-180" />
                    </Link>
                </div>
            </section>

             {/* D. Status Management */}
             <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#7A1F1F]" />
                        <h2 className="text-lg font-bold text-gray-900">Status & Actions</h2>
                    </div>
                    {/* Payment Toggle (Segmented Control) */}
                    <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => {
                                setBooking(prev => ({ 
                                    ...prev, 
                                    paymentStatus: 'UNPAID', 
                                    paidAmount: 0 
                                }))
                            }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                booking.paymentStatus === 'UNPAID' 
                                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Unpaid
                        </button>
                        <button
                            onClick={() => {
                                setBooking(prev => ({ 
                                    ...prev, 
                                    paymentStatus: 'PAID', 
                                    paidAmount: prev.totalPrice 
                                }))
                            }}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                booking.paymentStatus === 'PAID' 
                                    ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' 
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Paid
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="mb-8 overflow-x-auto pb-4">
                     <div className="flex items-center min-w-[600px] justify-between relative">
                         {/* Dashed Line Background */}
                         <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-10" />
                         
                         {BOOKING_STEPS.map((step, index) => {
                             const isCompleted = BOOKING_STEPS.indexOf(booking.status) >= index
                             const isCurrent = booking.status === step
                             const isCancelled = booking.status === "CANCELLED"

                             let colorClass = isCompleted ? "bg-[#7A1F1F] border-[#7A1F1F] text-white" : "bg-white border-gray-200 text-gray-400"
                             if (isCurrent && !isCancelled) colorClass = "bg-white border-[#7A1F1F] text-[#7A1F1F] ring-4 ring-[#7A1F1F]/10"
                             if (isCancelled) colorClass = "bg-gray-100 border-gray-300 text-gray-400"

                             return (
                                 <div key={step} className="flex flex-col items-center gap-2 group relative">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all ${colorClass}`}>
                                          {isCompleted && !isCurrent ? <CheckCircle className="h-3.5 w-3.5" /> : (index + 1)}
                                      </div>
                                      <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? "text-[#7A1F1F]" : "text-gray-500"}`}>
                                          {step.replace("_", " ")}
                                      </span>
                                 </div>
                             )
                         })}
                     </div>
                </div>

                {/* Action Area based on Status */}
                <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200">
                    {booking.status === "BOOKED" && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Client belum melakukan pembayaran penuh? Atau sesi belum dimulai?</p>
                            <button 
                                onClick={() => updateStatus("PAID")}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <CreditCard className="h-4 w-4" />
                                Mark as Paid
                            </button>
                        </div>
                    )}
                    {booking.status === "PAID" && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Pembayaran lunas. Siap untuk sesi foto?</p>
                             <button 
                                onClick={() => updateStatus("SHOOT_DONE")}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                Mark as Shoot Done
                            </button>
                        </div>
                    )}
                    {booking.status === "SHOOT_DONE" && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 font-medium">Upload Hasil Foto</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Paste Google Drive Link here..."
                                    value={gdriveLink}
                                    onChange={(e) => setGdriveLink(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                                />
                                <button
                                    onClick={() => {
                                        if(!gdriveLink) {
                                            showToast("Link Google Drive wajib diisi!", "warning")
                                            return
                                        }
                                        updateStatus("PHOTOS_DELIVERED")
                                        showToast("Photos delivered successfully!", "success")
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    Deliver Photos
                                </button>
                            </div>
                        </div>
                    )}
                     {booking.status === "PHOTOS_DELIVERED" && (
                        <div className="flex items-center gap-3 justify-end">
                             <button
                                onClick={() => showToast("Print order feature coming soon", "info")}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Create Print Link
                            </button>
                             <button 
                                onClick={() => updateStatus("CLOSED")}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Close Order
                            </button>
                        </div>
                    )}
                    {booking.status === "CLOSED" && (
                        <div className="text-center text-green-600 font-medium flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Order Completed.
                        </div>
                    )}
                    {booking.status === "CANCELLED" && (
                        <div className="text-center text-red-500 font-medium flex items-center justify-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Order Cancelled.
                        </div>
                    )}
                </div>
             </section>

             {/* B. Booking Details */}
             <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <CalendarCheck className="h-5 w-5 text-[#7A1F1F]" />
                    <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-x-12 gap-y-6">
                         <div>
                             <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Tanggal & Waktu</label>
                             <p className="font-medium text-gray-900 flex items-center gap-2">
                                 <Clock className="h-4 w-4 text-gray-400" />
                                 {formatDate(booking.sessionDate)} • {booking.sessionTime}
                             </p>
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Package</label>
                             <p className="font-medium text-gray-900">{booking.package.name}</p>
                             <p className="text-xs text-gray-500">{booking.package.description}</p>
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Background</label>
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">
                                 <div className="w-2 h-2 rounded-full bg-gray-400"/>
                                 {booking.background.name}
                             </span>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                             <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Photo For</label>
                             <p className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">"Graduation Session"</p> 
                             {/* Hardcoded for style demo as mock data lacks this field specifically, usually stored in notes or bespoke field */}
                        </div>
                         <div>
                             <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">BTS Video</label>
                             <p className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                                 <Film className="h-4 w-4" />
                                 Include BTS
                             </p>
                        </div>
                    </div>

                    {booking.notes && (
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                             <label className="text-xs text-yellow-700 font-bold uppercase tracking-wider block mb-1">Notes from Client</label>
                             <p className="text-sm text-yellow-800">{booking.notes}</p>
                        </div>
                    )}
                </div>
            </section>

             {/* C. Add-ons Table */}
             <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-[#7A1F1F]" />
                        <h2 className="text-lg font-bold text-gray-900">Add-ons</h2>
                    </div>
                    <button 
                        onClick={handleAddMockAddon}
                        className="text-sm text-[#7A1F1F] font-medium hover:underline flex items-center gap-1"
                    >
                        + Add Item
                    </button>
                </div>
                 {booking.addOns.length > 0 ? (
                     <div className="overflow-hidden rounded-xl border border-gray-200">
                         <table className="w-full text-sm text-left bg-white">
                             <thead className="bg-gray-50 text-gray-500 font-medium">
                                 <tr>
                                     <th className="px-4 py-3">Item</th>
                                     <th className="px-4 py-3 w-20 text-center">Qty</th>
                                     <th className="px-4 py-3 w-32 text-right">Price</th>
                                     <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                                     <th className="px-4 py-3 w-10"></th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {booking.addOns.map((item, idx) => (
                                     <tr key={idx}>
                                         <td className="px-4 py-3 font-medium text-gray-900">{item.addOn.name}</td>
                                         <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                         <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                                         <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button 
                                                onClick={() => handleRemoveAddon(idx)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                 <Trash2 className="h-4 w-4" />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 ) : (
                     <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                         No add-ons added yet.
                     </div>
                 )}
             </section>

             {/* E. Print Order Tracking (Conditional) */}
             {printOrder && (
                 <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Printer className="h-5 w-5 text-[#7A1F1F]" />
                        <h2 className="text-lg font-bold text-gray-900">Print Order Tracking</h2>
                    </div>

                    {/* Stepper */}
                    <div className="mb-8 overflow-x-auto pb-2">
                        <div className="flex items-center min-w-[600px] justify-between relative px-2">
                             <div className="absolute top-1.5 left-0 w-full h-0.5 bg-gray-100 z-0" />
                             {PRINT_STATUS_STEPS.map((step, idx) => {
                                  const currentIdx = PRINT_STATUS_STEPS.findIndex(s => s.status === printOrder.status)
                                  const isCompleted = currentIdx >= idx
                                  const isCurrent = printOrder.status === step.status
                                  
                                  return (
                                     <div key={idx} className="flex flex-col items-center gap-2 z-10 relative group cursor-pointer" onClick={() => updatePrintStatus(step.status)}>
                                          <div className={`w-3 h-3 rounded-full transition-all ${isCompleted ? "bg-[#7A1F1F] ring-4 ring-white" : "bg-gray-300 ring-4 ring-white"}`} />
                                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? "text-[#7A1F1F]" : "text-gray-400"}`}>
                                              {step.label}
                                          </span>
                                     </div>
                                  )
                             })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-5">
                         <div>
                             <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Vendor Info</label>
                             <p className="text-sm font-medium text-gray-900">{printOrder.vendorName || "-"}</p>
                         </div>
                          <div>
                             <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Tracking Number</label>
                             <p className="text-sm font-mono font-medium text-gray-900">{printOrder.courier} - {printOrder.trackingNumber || "Pending"}</p>
                         </div>
                         <div className="md:col-span-2">
                             <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Shipping Address</label>
                             <p className="text-sm text-gray-700">{printOrder.shippingAddress || "-"}</p>
                         </div>
                    </div>
                 </section>
             )}


        </div>

        {/* --- RIGHT COLUMN: SIDEBAR SUMMARY --- */}
        <div className="hidden lg:block w-[360px] shrink-0">
             <div className="sticky top-6 flex flex-col gap-6">
                 
                 {/* Price Summary Card */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                          <CreditCard className="h-5 w-5 text-[#7A1F1F]" />
                          <h3 className="text-lg font-bold text-gray-900">Ringkasan Harga</h3>
                      </div>

                      <div className="space-y-3 text-sm mb-6">
                           <div className="flex justify-between items-start">
                               <span className="text-gray-600">{booking.package.name}</span>
                               <span className="font-medium text-gray-900">{formatCurrency(booking.package.price)}</span>
                           </div>
                           
                           {booking.addOns.length > 0 && (
                               <div className="space-y-2 pl-3 border-l-2 border-gray-100 py-1">
                                   {booking.addOns.map((item, i) => (
                                       <div key={i} className="flex justify-between text-xs text-gray-500">
                                           <span>{item.addOn.name} (x{item.quantity})</span>
                                           <span>{formatCurrency(item.price * item.quantity)}</span>
                                       </div>
                                   ))}
                               </div>
                           )}

                           <div className="pt-3 border-t border-gray-100 flex justify-between font-medium">
                               <span className="text-gray-900">Subtotal</span>
                               <span>{formatCurrency(booking.subtotal)}</span>
                           </div>

                             {booking.discount > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount</span>
                                    <span>- {formatCurrency(booking.discount)}</span>
                                </div>
                            )}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
                           <div className="flex justify-between items-end mb-1">
                               <span className="text-base font-bold text-gray-900">TOTAL</span>
                               <span className="text-2xl font-bold text-[#7A1F1F]">{formatCurrency(booking.totalPrice)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-200">
                               <span className="text-gray-500">Total Paid</span>
                               <span className="font-medium text-green-700">{formatCurrency(booking.paidAmount)}</span>
                           </div>
                            <div className="flex justify-between items-center text-xs mt-1">
                               <span className="text-gray-500">Outstanding</span>
                               <span className={`font-bold ${outstanding > 0 ? "text-red-600 bg-red-50 px-1 rounded" : "text-gray-400"}`}>
                                   {formatCurrency(outstanding)}
                               </span>
                           </div>
                      </div>

                      {/* Staff Handling */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                              {booking.photographer?.name?.[0] || "?"}
                          </div>
                          <div className="text-xs">
                              <p className="text-gray-500">Handled by</p>
                              <p className="font-medium text-gray-900">{booking.photographer?.name || "Unassigned"}</p>
                          </div>
                      </div>
                 </div>

                 {/* Invoice Card */}
                 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Invoice Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                              <Download className="h-5 w-5 text-gray-500" />
                              <span className="text-xs font-medium text-gray-700">Download</span>
                          </button>
                          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                              <Printer className="h-5 w-5 text-gray-500" />
                              <span className="text-xs font-medium text-gray-700">Print</span>
                          </button>
                           <button className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                              <Share2 className="h-4 w-4 text-gray-500" />
                              <span className="text-xs font-medium text-gray-700">Share Link</span>
                          </button>
                      </div>
                 </div>

             </div>
        </div>

      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
      />
      {/* Cancel Modal */}
       <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? The status will be updated to CANCELLED."
        confirmLabel="Confirm Cancel"
        variant="danger"
        onConfirm={confirmCancel}
      />
    </div>
  )
}
