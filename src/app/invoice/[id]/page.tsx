"use client"

import { useState } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Download, Copy, Check, Share2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { PAYMENT_STATUS_MAP } from "@/lib/constants"
import { useInvoice } from "@/lib/hooks/use-invoice"

export default function InvoicePage() {
  const params = useParams()
  const id = params?.id as string
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  // SWR hook — caches response so revisiting invoice is instant
  const { booking, studio, isLoading, isError } = useInvoice(id)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-[#7A1F1F] rounded-full"></div>
      </div>
    )
  }

  if (isError || !booking) {
    notFound()
    return null
  }

  // Generate Invoice Number - using Date + Booking ID
  const invoiceNumber = `INV-${booking.bookingCode.replace("YS-", "")}`
  const invoiceDate = new Date()

  // Items for the table
  const items = [
    {
      description: `Photography Package: ${booking.package.name}`,
      notes: booking.package.description,
      quantity: 1,
      unitPrice: booking.package.price,
      total: booking.package.price,
    },
    ...booking.addOns.map((item: any) => ({
      description: `Add-on: ${item.itemName}`,
      notes: item.paymentStatus === 'UNPAID' ? '(BELUM LUNAS)' : null,
      notesColor: item.paymentStatus === 'UNPAID' ? 'text-red-500 font-bold' : 'text-gray-500',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    })),
  ]

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    showToast("Link invoice berhasil disalin!", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const url = window.location.href
    const message = encodeURIComponent(
      `Halo ${booking.client.name}!\n\nBerikut adalah invoice untuk booking Anda:\n\nInvoice: ${invoiceNumber}\nBooking: ${booking.bookingCode}\nTotal: ${formatCurrency(booking.totalAmount)}\n\nLihat detail invoice: ${url}\n\nTerima kasih!`
    )
    // Clean phone number - remove spaces, dashes, and format to international
    let phoneNumber = booking.client.phone.replace(/[\s\-\(\)]/g, '')
    // If starts with 0, replace with 62 (Indonesia country code)
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1)
    }
    // If doesn't start with +, add it
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber
    }

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
  }

  const paymentStatus = booking.paymentStatus ? (PAYMENT_STATUS_MAP as any)[booking.paymentStatus] : PAYMENT_STATUS_MAP["UNPAID"]

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white font-sans text-gray-900">
      {/* Navbar / Actions (Hidden on Print) */}
      <div className="max-w-[800px] mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <Link
            href={`/dashboard/bookings/${id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#7A1F1F] transition-colors self-start sm:self-auto"
        >
            <ArrowLeft className="h-4 w-4" /> Back to Booking
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
            </button>
            <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
            >
                <Share2 className="h-4 w-4" /> Share to WhatsApp
            </button>
             <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-[#7A1F1F] text-white rounded-lg hover:bg-[#9B3333] transition-colors text-sm font-medium shadow-sm"
            >
                <Download className="h-4 w-4" /> Download
            </button>
        </div>
      </div>

      {/* Invoice Sheet (Max width 800px approx A4 width) */}
      <div id="invoice-content" className="max-w-[800px] mx-auto bg-white shadow-xl rounded-none sm:rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:m-0 print:overflow-visible">

        {/* Header */}
        <div className="p-8 md:p-12 pb-6 print:p-8">
             <div className="flex justify-between items-start">
                 {/* Left: Logo & Studio Info */}
                 <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                          <Image
                            src={(studio?.logoUrl && studio.logoUrl.trim() !== '') ? studio.logoUrl : "/logo_yoonjae.png"}
                            alt="Yoonjae Space"
                            width={50}
                            height={50}
                            className="object-contain"
                            priority
                          />
                          <span className="text-xl font-bold text-[#7A1F1F] tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
                            {studio?.name || "Yoonjaespace"}
                          </span>
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed font-medium">
                          {studio?.address || ""}<br/>
                          {studio?.phone || ""} • {studio?.instagram || ""}
                      </div>
                 </div>

                 {/* Right: INVOICE Title */}
                 <div className="text-right">
                     <h1 className="text-4xl font-bold text-[#7A1F1F] tracking-widest uppercase mb-2" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
                        INVOICE
                     </h1>
                     <div className="h-0.5 w-full bg-[#7A1F1F]/20 ml-auto"></div>
                 </div>
             </div>
        </div>

        {/* Invoice Info Row */}
        <div className="px-8 md:px-12 py-6 print:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-[#7A1F1F]/10 pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Invoice No.</p>
                        <p className="text-sm font-bold text-gray-900">{invoiceNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(invoiceDate.toISOString())}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Session Date</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(booking.date)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Booking Ref</p>
                        <Link href={`/dashboard/bookings/${id}`} className="text-sm font-bold text-[#7A1F1F] underline decoration-dotted hover:decoration-solid print:no-underline print:text-gray-900">
                             {booking.bookingCode}
                        </Link>
                    </div>
                </div>
                <div className="shrink-0 self-end sm:self-center">
                    <span
                        className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border"
                        style={{
                            backgroundColor: paymentStatus.bgColor,
                            color: paymentStatus.color,
                            borderColor: paymentStatus.borderColor
                        }}
                    >
                        {booking.paymentStatus === "PAID" ? "PAID" : booking.paymentStatus === "PARTIALLY_PAID" ? "PARTIALLY PAID" : "UNPAID"}
                    </span>
                </div>
            </div>
        </div>

        {/* Client Info (Bill To) */}
        <div className="px-8 md:px-12 pb-8 print:px-8">
            <div className="w-full sm:w-1/2">
                <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">Bill To:</h3>
                <p className="text-base font-bold text-gray-900">{booking.client.name}</p>
                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                    <p>{booking.client.phone}</p>
                    <p>{booking.client.email}</p>
                    {booking.client.address && <p>{booking.client.address}</p>}
                </div>
            </div>
        </div>

        {/* Table Separator */}
        <div className="border-t border-[#7A1F1F] mx-8 md:mx-12 print:mx-8 mb-0"></div>

        {/* Items Table */}
        <div className="px-8 md:px-12 pb-6 print:px-8 pt-0">
             <table className="w-full text-sm">
                 <thead>
                     <tr className="bg-[#F5ECEC] text-[#7A1F1F]">
                         <th className="text-left font-bold py-3 px-4 w-[50%]">Item</th>
                         <th className="text-center font-bold py-3 px-4 w-[10%]">Qty</th>
                         <th className="text-right font-bold py-3 px-4 w-[20%]">Price</th>
                         <th className="text-right font-bold py-3 px-4 w-[20%]">Subtotal</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {items.map((item, i) => (
                         <tr key={i} className={i % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}>
                             <td className="py-3 px-4">
                                 <p className="font-semibold text-gray-900">{item.description}</p>
                                 {item.notes && <p className={`text-xs mt-0.5 italic ${item.notesColor || 'text-gray-500'}`}>{item.notes}</p>}
                             </td>
                             <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                             <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                             <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                         </tr>
                     ))}

                     {/* Discount Row if any */}
                     {booking.discountAmount > 0 && (
                         <tr className="bg-red-50/50">
                             <td colSpan={3} className="py-3 px-4 text-right text-red-600 italic font-medium">Discount</td>
                             <td className="py-3 px-4 text-right text-red-600 font-medium whitespace-nowrap">- {formatCurrency(booking.discountAmount)}</td>
                         </tr>
                     )}
                 </tbody>
                 <tfoot>
                    {/* Subtotal */}
                    <tr>
                         <td colSpan={3} className="pt-4 px-4 text-right text-gray-500 text-xs uppercase font-bold tracking-wider">Subtotal</td>
                         <td className="pt-4 px-4 text-right font-bold text-gray-700">{formatCurrency(booking.packagePrice + booking.addOns.reduce((sum: number, item: any) => sum + (item.subtotal || item.unitPrice * item.quantity), 0))}</td>
                     </tr>

                     {/* Total */}
                     <tr>
                         <td colSpan={4} className="py-2">
                             <div className="flex justify-end items-center mt-2 bg-[#F5ECEC]/50 p-2 border-t-2 border-double border-[#7A1F1F]">
                                 <span className="text-[#7A1F1F] font-bold text-lg mr-8">TOTAL</span>
                                 <span className="text-[#7A1F1F] font-bold text-xl">{formatCurrency(booking.totalAmount)}</span>
                             </div>
                         </td>
                     </tr>
                 </tfoot>
             </table>
        </div>

        {/* Payment & Footer */}
        <div className="px-8 md:px-12 pb-8 print:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-0">
                 <div>
                     <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Payment Details</h3>

                     {booking.payments && booking.payments.length > 0 ? (
                        <div className="space-y-2">
                            {booking.payments.map((payment: any, idx: number) => (
                                <div key={payment.id} className="border-l-4 border-green-600 pl-3 py-1.5 bg-green-50/30">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-semibold text-gray-900">
                                                {payment.description || `Payment ${idx + 1}`}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-green-700">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        Paid on {formatDate(payment.paidAt)}
                                    </p>
                                    {payment.notes && (
                                        <p className="text-xs text-gray-600 ml-6 mt-0.5 italic">
                                            {payment.notes}
                                        </p>
                                    )}
                                </div>
                            ))}

                            <div className="pt-2 border-t border-gray-200 mt-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-gray-900">Total Paid:</span>
                                    <span className="text-sm font-bold text-green-700">
                                        {formatCurrency(booking.paidAmount)}
                                    </span>
                                </div>
                                {booking.outstandingBalance > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-900">Outstanding Balance:</span>
                                        <span className="text-sm font-bold text-red-600">
                                            {formatCurrency(booking.outstandingBalance)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                     ) : (
                        <div className="text-sm text-gray-500 italic">
                            No payment records yet
                        </div>
                     )}
                 </div>

                 <div className="flex flex-col items-end justify-end">
                     <div className="text-center">
                         <p className="text-xs text-gray-400 mb-12">Authorized Signature</p>
                         <div className="border-t border-gray-300 w-40 text-center pt-2">
                             <p className="text-xs font-bold text-gray-900">{studio?.name || "Yoonjae Space"} Manager</p>
                         </div>
                     </div>
                 </div>
            </div>

             <div className="mt-8 text-center text-xs text-gray-400 print:mt-12">
                 <p>{studio?.footerText || `Thank you for choosing ${studio?.name || "Yoonjaespace Studio"}!`}</p>
              </div>
        </div>

      </div>
    </div>
  )
}
