"use client"

import { useState } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Script from "next/script"
import { ArrowLeft, Printer, Download, Loader2, Copy, Check } from "lucide-react"
import { mockBookings } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { PAYMENT_STATUS_MAP } from "@/lib/constants"

interface JsPDF {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
  addPage: () => void
  save: (filename: string) => void
  getImageProperties: (data: string) => { width: number; height: number }
}

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
    jspdf: {
      jsPDF: new (options?: Record<string, unknown>) => JsPDF
    }
  }
}

export default function InvoicePage() {
  const params = useParams()
  const id = params?.id as string
  const { showToast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState({ html2canvas: false, jspdf: false })
  const [copied, setCopied] = useState(false)

  // Find the booking
  const booking = mockBookings.find((b) => b.id === id)

  if (!booking) {
    notFound()
    return null
  }

  // Generate Invoice Number (Mock) - using Date + Booking ID
  const invoiceNumber = `INV-${booking.bookingCode.replace("YS-", "")}`
  const invoiceDate = new Date() // Today

  // Items for the table
  const items = [
    {
      description: `Photography Package: ${booking.package.name}`,
      notes: booking.package.description,
      quantity: 1,
      unitPrice: booking.package.price,
      total: booking.package.price,
    },
    ...booking.addOns.map((item) => ({
      description: `Add-on: ${item.addOn.name}`,
      notes: null,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
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

  const handleDownload = async () => {
    if (!scriptsLoaded.html2canvas || !scriptsLoaded.jspdf) {
        showToast("PDF libraries are still loading. Please try again in a moment.", "warning")
        return
    }

    setIsDownloading(true)
    try {
        const element = document.getElementById("invoice-content")
        if (!element) {
            showToast("Invoice content not found", "error")
            setIsDownloading(false)
            return
        }

        console.log("Starting PDF generation...")

        const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: true,
            backgroundColor: "#ffffff", // Force white background
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            onclone: (clonedDoc: Document) => {
                const clonedElement = clonedDoc.getElementById("invoice-content")
                if (clonedElement) {
                    // Force legacy colors and remove problematic CSS variables if any
                    // We need to be aggressive here because html2canvas fails on ANY usage of lab()/oklch()
                    
                    for (const el of Array.from(clonedElement.getElementsByTagName("*"))) {
                        const targetEl = el as HTMLElement
                        const style = window.getComputedStyle(targetEl)
                        
                        // Handle Background Color
                        if (style.backgroundColor && (style.backgroundColor.includes("oklch") || style.backgroundColor.includes("lab"))) {
                            // Reset to safe defaults based on common patterns
                            if (targetEl.classList.contains("bg-white")) targetEl.style.backgroundColor = "#ffffff"
                            else if (targetEl.classList.contains("bg-gray-100")) targetEl.style.backgroundColor = "#f3f4f6"
                            else if (targetEl.classList.contains("bg-[#7A1F1F]")) targetEl.style.backgroundColor = "#7A1F1F"
                            else if (targetEl.classList.contains("bg-[#F5ECEC]")) targetEl.style.backgroundColor = "#F5ECEC"
                            else targetEl.style.backgroundColor = "#ffffff" // Default fallback
                        }

                        // Handle Text Color
                        if (style.color && (style.color.includes("oklch") || style.color.includes("lab"))) {
                             if (targetEl.classList.contains("text-white")) targetEl.style.color = "#ffffff"
                             else if (targetEl.classList.contains("text-[#7A1F1F]")) targetEl.style.color = "#7A1F1F"
                             else if (targetEl.classList.contains("text-gray-900")) targetEl.style.color = "#111827"
                             else if (targetEl.classList.contains("text-gray-600")) targetEl.style.color = "#4b5563"
                             else targetEl.style.color = "#000000" // Default fallback
                        }
                        
                        // Handle Border Color
                        if (style.borderColor && (style.borderColor.includes("oklch") || style.borderColor.includes("lab"))) {
                            targetEl.style.borderColor = "#e5e7eb"
                        }

                        // Remove shadows
                        targetEl.style.boxShadow = "none"
                    }
                }
            }
        })

        const imgData = canvas.toDataURL("image/png", 1.0)

        const { jsPDF } = window.jspdf
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        })

        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        let heightLeft = pdfHeight
        let position = 0

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight
            pdf.addPage()
            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
            heightLeft -= pdf.internal.pageSize.getHeight()
        }

        pdf.save(`${invoiceNumber}.pdf`)
        showToast("Invoice berhasil didownload", "success")

    } catch (error) {
        console.error("Download failed:", error)
        showToast("Gagal download PDF. Silakan coba print.", "error")
    } finally {
        setIsDownloading(false)
    }
  }

  const paymentStatus = booking.paymentStatus ? PAYMENT_STATUS_MAP[booking.paymentStatus] : PAYMENT_STATUS_MAP["UNPAID"]

  return (
    <>
    <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" 
        strategy="lazyOnload" 
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, html2canvas: true }))}
    />
    <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" 
        strategy="lazyOnload" 
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, jspdf: true }))}
    />
    
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
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
                <Printer className="h-4 w-4" /> Print
            </button>
            <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 py-2 bg-[#7A1F1F] text-white rounded-lg hover:bg-[#9B3333] transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                {isDownloading ? "Generating..." : "Download PDF"}
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
                            src="/logo_yoonjae.png" 
                            alt="Yoonjae Space" 
                            width={50} 
                            height={50} 
                            className="object-contain" // Assuming square logo
                            priority
                          />
                          <span className="text-xl font-bold text-[#7A1F1F] tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
                            Yoonjaespace
                          </span>
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed font-medium">
                          Jl. Kaliurang KM 5, Gang Megatruh<br/>
                          Yogyakarta, DIY 55281<br/>
                          +62 812-3456-7890 • @yoonjaespace
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 w-full">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Invoice Number</p>
                        <p className="text-sm font-bold text-gray-900">{invoiceNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Date</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(invoiceDate.toISOString())}</p>
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
                        {booking.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
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
        <div className="px-8 md:px-12 pb-8 print:px-8 pt-0">
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
                                 {item.notes && <p className="text-gray-500 text-xs mt-0.5 italic">{item.notes}</p>}
                             </td>
                             <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                             <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                             <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                         </tr>
                     ))}
                     
                     {/* Discount Row if any */}
                     {booking.discount > 0 && (
                         <tr className="bg-red-50/50">
                             <td colSpan={3} className="py-3 px-4 text-right text-red-600 italic font-medium">Discount</td>
                             <td className="py-3 px-4 text-right text-red-600 font-medium whitespace-nowrap">- {formatCurrency(booking.discount)}</td>
                         </tr>
                     )}
                 </tbody>
                 <tfoot>
                    {/* Subtotal */}
                    <tr>
                         <td colSpan={3} className="pt-4 px-4 text-right text-gray-500 text-xs uppercase font-bold tracking-wider">Subtotal</td>
                         <td className="pt-4 px-4 text-right font-bold text-gray-700">{formatCurrency(booking.subtotal)}</td>
                     </tr>
                     
                     {/* Total */}
                     <tr>
                         <td colSpan={4} className="py-2">
                             <div className="flex justify-end items-center mt-2 bg-[#F5ECEC]/50 p-2 border-t-2 border-double border-[#7A1F1F]">
                                 <span className="text-[#7A1F1F] font-bold text-lg mr-8">TOTAL</span>
                                 <span className="text-[#7A1F1F] font-bold text-xl">{formatCurrency(booking.totalPrice)}</span>
                             </div>
                         </td>
                     </tr>
                 </tfoot>
             </table>
        </div>

        {/* Payment & Footer */}
        <div className="px-8 md:px-12 pb-12 print:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                 <div>
                     <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-3">Payment Info</h3>
                     
                     {booking.paidAmount > 0 && (
                        <div className="mb-4 text-sm">
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                                <Check className="h-4 w-4" />
                                <span>Paid Amount: {formatCurrency(booking.paidAmount)}</span>
                            </div>
                            {(booking.totalPrice - booking.paidAmount) > 0 && (
                                <div className="text-red-600 font-bold mt-1">
                                    Outstanding Balance: {formatCurrency(booking.totalPrice - booking.paidAmount)}
                                </div>
                            )}
                        </div>
                     )}

                     <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 border border-gray-100">
                         <div className="flex justify-between mb-1">
                             <span>Bank Name:</span>
                             <span className="font-bold text-gray-800">BCA (Bank Central Asia)</span>
                         </div>
                         <div className="flex justify-between mb-1">
                             <span>Account No:</span>
                             <span className="font-bold text-gray-800 font-mono text-sm">123-456-7890</span>
                         </div>
                         <div className="flex justify-between">
                             <span>Account Name:</span>
                             <span className="font-bold text-gray-800">Yoonjae Space Official</span>
                         </div>
                     </div>
                 </div>

                 <div className="text-right flex flex-col items-end justify-end">
                     <p className="text-xs text-gray-400 mb-16">Authorized Signature</p>
                     <div className="border-t border-gray-300 w-40 text-center pt-2">
                         <p className="text-xs font-bold text-gray-900">Yoonjae Space Manager</p>
                     </div>
                 </div>
             </div>
             
             <div className="mt-12 text-center text-xs text-gray-400 print:mt-24">
                 <p>Thank you for choosing Yoonjae Space for your special moments! 💕</p>
                 <p className="mt-1">yoonjaespace.com | @yoonjaespace</p>
             </div>
        </div>

      </div>
    </div>
    </>
  )
}
