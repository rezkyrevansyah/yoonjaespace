import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Users, 
  Package, 
  Sparkles, 
  Camera,
  Activity,
  Copy,
  FileText,
  Trash2,
  MessageCircle
} from "lucide-react"
import { Booking } from "@/lib/types"
import { PermissionGate } from "@/components/shared/permission-gate"
import Link from "next/link"

interface OverviewTabProps {
  booking: any;
  calculateDuration: (b: any) => number;
  actions: any;
}

export function OverviewTab({ booking, calculateDuration, actions }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Mobile Actions (Hidden on Desktop) */}
      <div className="sm:hidden flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4">
        <a
          href={`/status/${booking.publicSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#7A1F1F] text-white rounded-xl text-sm font-semibold hover:bg-[#601818] transition-all shadow-sm whitespace-nowrap shrink-0"
        >
          <Activity className="h-3.5 w-3.5" />
          Customer Page
        </a>
        <button
          onClick={actions.handleCopyCustomerLink}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#7A1F1F] text-[#7A1F1F] rounded-xl text-sm font-semibold hover:bg-[#7A1F1F]/5 transition-all shadow-sm whitespace-nowrap shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
          Share Link
        </button>
        <a
          href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all whitespace-nowrap shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WA Client
        </a>
        <Link
          href={`/invoice/${booking.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all whitespace-nowrap shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          Invoice
        </Link>
        <PermissionGate allowedRoles={["OWNER", "ADMIN"]}>
          <button
            onClick={() => actions.setDeleteModalOpen(true)}
            className="p-2 shrink-0 rounded-xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-all"
            title="Delete booking"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </PermissionGate>
      </div>

      {/* ── TOP DETAILS CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Client</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-gray-900 leading-none">{booking.client.name}</h2>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <a
                href={`https://wa.me/${booking.client.phone.replace(/^0/, '62')}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-green-600 transition-colors"
                rel="noreferrer"
              >
                <Phone className="h-3.5 w-3.5" />
                {booking.client.phone}
              </a>
              {booking.client.email && (
                <a
                  href={`mailto:${booking.client.email}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {booking.client.email}
                </a>
              )}
              {booking.client.instagram && (
                <a
                  href={`https://instagram.com/${booking.client.instagram.replace('@', '')}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-pink-600 transition-colors"
                  rel="noreferrer"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  {booking.client.instagram}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={booking.status} type="booking" />
              <StatusBadge status={booking.paymentStatus} type="payment" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
            {/* Date */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5"/> Tanggal</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(booking.date)}</p>
            </div>
            {/* Time */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Jam Sesi</p>
              <p className="text-sm font-semibold text-gray-900 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                {formatDate(booking.startTime, 'HH:mm')} - {formatDate(booking.endTime, 'HH:mm')}
              </p>
            </div>
            {/* Duration */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Durasi</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-purple-600 border border-purple-200 bg-purple-50 px-2 py-0.5 rounded-md inline-block">{calculateDuration(booking)} menit</p>
              </div>
            </div>
            {/* Package */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Package className="h-3.5 w-3.5"/> Package</p>
              <p className="text-sm font-semibold text-gray-900">{booking.package?.name || "—"}</p>
            </div>

            {/* People */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/> Jumlah Orang</p>
              <p className="text-sm font-semibold text-gray-900">{booking.numberOfPeople} orang</p>
            </div>
            {/* Photo For */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Photo For</p>
              <p className="text-sm font-semibold text-gray-900">{booking.photoFor}</p>
            </div>
            {/* Background */}
            <div className="col-span-2 lg:col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Background</p>
              <div className="flex flex-wrap gap-2">
                {booking.bookingBackgrounds && booking.bookingBackgrounds.length > 0 ? (
                  booking.bookingBackgrounds.map((bg: any) => (
                    <span key={bg.id} className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-md">
                      {bg.background?.name || 'Background'}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">{"—"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add-ons List */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5"/> Add-ons Terpilih</p>
              {booking.addOns && booking.addOns.length > 0 ? (
                <div className="space-y-2">
                  {booking.addOns.map((addon: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5">
                      <span className="font-semibold text-gray-800">{addon.itemName} <span className="text-gray-400 ml-1">×{addon.quantity}</span></span>
                      <span className="font-bold text-gray-900 text-xs">{formatCurrency(addon.subtotal || addon.unitPrice * addon.quantity)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">Tidak ada add-ons</p>
              )}
            </div>

            {/* BTS & Notes */}
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> BTS (Behind The Scenes)</p>
                <span className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border inline-block",
                  booking.bts ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                )}>
                  {booking.bts ? "Ya, BTS diminta" : "Tidak ada BTS"}
                </span>
              </div>
              {booking.notes && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Catatan Client</p>
                  <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 p-3.5 rounded-xl italic font-medium leading-relaxed shadow-sm">
                    &quot;{booking.notes}&quot;
                  </p>
                </div>
              )}
              {booking.internalNotes && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Internal Notes</p>
                  <p className="text-sm text-blue-900 bg-blue-50 border border-blue-100 p-3.5 rounded-xl italic font-medium leading-relaxed shadow-sm">
                    &quot;{booking.internalNotes}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
          <span className="w-4 h-4 text-[#7A1F1F]">ℹ️</span> Informasi Tambahan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Custom Fields */}
          <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 border-b border-gray-50 pb-2">Custom Fields</h4>
              {booking.customFields && booking.customFields.length > 0 ? (
                <div className="space-y-3">
                  {booking.customFields.map((cf: any) => (
                    <div key={cf.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{cf.field?.fieldName}</p>
                      <p className="text-sm font-semibold text-gray-900">{cf.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Tidak ada custom fields.</p>
              )}
          </div>

          {/* Handled By */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-50 pb-2">Penanggung Jawab</h4>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-lg font-black text-gray-600 shrink-0 shadow-sm">
                {booking.handledBy?.name?.[0] || "?"}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Ditangani Oleh</p>
                <p className="text-base font-bold text-gray-900">{booking.handledBy?.name || "Unassigned"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
