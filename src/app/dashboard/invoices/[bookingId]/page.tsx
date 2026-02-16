"use client"

import { use } from "react"
import Link from "next/link"
import { mockBookings } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Printer, Camera } from "lucide-react"

export default function InvoicePage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  const booking = mockBookings.find((b) => b.id === bookingId)

  if (!booking) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-lg font-medium text-[#111827]">Booking tidak ditemukan</p>
        <Link href="/dashboard/bookings" className="text-sm text-[#7A1F1F] hover:text-[#9B3333] mt-2 inline-block">
          Kembali ke bookings
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      {/* Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href={`/dashboard/bookings/${booking.id}`}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors"
        >
          <Printer className="h-4 w-4" />
          Cetak
        </button>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A1F1F] flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#111827]">Yoonjaespace</h1>
              <p className="text-xs text-[#6B7280]">Studio Management</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">INVOICE</h2>
            <p className="text-sm text-[#6B7280] mt-1">{booking.bookingCode}</p>
            <p className="text-xs text-[#9CA3AF]">{formatDate(booking.createdAt)}</p>
          </div>
        </div>

        {/* Client & Session Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs text-[#6B7280] mb-1">Tagihan untuk:</p>
            <p className="text-sm font-semibold text-[#111827]">{booking.client.name}</p>
            <p className="text-sm text-[#6B7280]">{booking.client.phone}</p>
            {booking.client.email && (
              <p className="text-sm text-[#6B7280]">{booking.client.email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6B7280] mb-1">Detail Sesi:</p>
            <p className="text-sm text-[#111827]">{formatDate(booking.sessionDate)}</p>
            <p className="text-sm text-[#6B7280]">{booking.sessionTime}</p>
            <p className="text-sm text-[#6B7280]">{booking.background.name}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-[#111827]">
              <th className="text-left py-2 font-semibold text-[#111827]">Item</th>
              <th className="text-center py-2 font-semibold text-[#111827]">Qty</th>
              <th className="text-right py-2 font-semibold text-[#111827]">Harga</th>
              <th className="text-right py-2 font-semibold text-[#111827]">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {/* Package */}
            <tr className="border-b border-[#E5E7EB]">
              <td className="py-3">
                <p className="font-medium text-[#111827]">{booking.package.name}</p>
                <p className="text-xs text-[#6B7280]">{booking.package.duration} menit • {booking.package.editedPhotos} foto edit</p>
              </td>
              <td className="py-3 text-center text-[#6B7280]">1</td>
              <td className="py-3 text-right text-[#6B7280]">{formatCurrency(booking.package.price)}</td>
              <td className="py-3 text-right text-[#111827] font-medium">{formatCurrency(booking.package.price)}</td>
            </tr>

            {/* Add-ons */}
            {booking.addOns.map((item, i) => (
              <tr key={i} className="border-b border-[#E5E7EB]">
                <td className="py-3">
                  <p className="font-medium text-[#111827]">{item.addOn.name}</p>
                </td>
                <td className="py-3 text-center text-[#6B7280]">{item.quantity}</td>
                <td className="py-3 text-right text-[#6B7280]">{formatCurrency(item.addOn.price)}</td>
                <td className="py-3 text-right text-[#111827] font-medium">{formatCurrency(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-[#111827] pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280]">Subtotal</span>
            <span className="text-[#111827]">{formatCurrency(booking.subtotal)}</span>
          </div>
          {booking.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">
                Diskon {booking.voucher && `(${booking.voucher.code})`}
              </span>
              <span className="text-[#059669]">-{formatCurrency(booking.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#E5E7EB]">
            <span className="text-[#111827]">Total</span>
            <span className="text-[#7A1F1F]">{formatCurrency(booking.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B7280]">Dibayar</span>
            <span className="text-[#111827]">{formatCurrency(booking.paidAmount)}</span>
          </div>
          {booking.totalPrice - booking.paidAmount > 0 && (
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#DC2626]">Sisa Pembayaran</span>
              <span className="text-[#DC2626]">{formatCurrency(booking.totalPrice - booking.paidAmount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-[#9CA3AF]">Terima kasih telah memilih Yoonjaespace Studio</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Invoice ini digenerate secara otomatis oleh sistem</p>
        </div>
      </div>
    </div>
  )
}
