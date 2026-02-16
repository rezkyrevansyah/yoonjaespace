"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  Ticket,
  Users
} from "lucide-react"
import {
  mockClients,
  mockPackages,
  mockBackgrounds,
  mockAddOns,
  mockStaff,
  mockVouchers,
  mockCurrentUser,
} from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
// import { toast } from "sonner" // Removed to avoid dependency error
import { cn } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
// import { Calendar } from "@/components/ui/calendar" // Using native date input for simplicity as per requirement strictness

type ClientFormData = {
  id?: string
  name: string
  phone: string
  email: string
  instagram: string
  address: string
}

type AddOnItem = {
  id: string
  tempId: string // for unique key in list
  name: string
  quantity: number
  unitPrice: number
  isCustom: boolean
}

type DiscountType = "VOUCHER" | "MANUAL"
type ManualDiscountMethod = "PERCENTAGE" | "FIXED"

export default function NewBookingPage() {
  const router = useRouter()
  const { showToast } = useToast()

  // --- 1. Client Info (Inline Search) ---
  const [clientSearch, setClientSearch] = useState("")
  const [clientForm, setClientForm] = useState<ClientFormData>({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    address: "",
  })
  const [isClientFound, setIsClientFound] = useState(false)

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearch.length > 2) {
        const found = mockClients.find(
          (c) =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone.includes(clientSearch)
        )
        if (found) {
          setClientForm({
            id: found.id,
            name: found.name,
            phone: found.phone,
            email: found.email || "",
            instagram: found.instagram || "",
            address: found.address || "",
          })
          setIsClientFound(true)
        } else {
           // Not found: don't auto-clear if user is typing a new name, just reset ID
           setIsClientFound(false)
           setClientForm(prev => ({ ...prev, id: undefined }))
        }
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [clientSearch])

  // --- 2. Schedule ---
  const [sessionDate, setSessionDate] = useState("")
  const [sessionTime, setSessionTime] = useState("")

  const isTuesday = useMemo(() => {
    if (!sessionDate) return false
    const day = new Date(sessionDate).getDay()
    return day === 2 // 0=Sun, 1=Mon, 2=Tue
  }, [sessionDate])

  // --- 3. Session Details ---
  const [packageId, setPackageId] = useState("")
  const [backgroundId, setBackgroundId] = useState("")
  const [numPeople, setNumPeople] = useState(1)
  const [photoFor, setPhotoFor] = useState("")
  const [btsVideo, setBtsVideo] = useState(false)
  const [notes, setNotes] = useState("")

  // --- 4. Add-ons ---
  const [addOns, setAddOns] = useState<AddOnItem[]>([])

  const handleAddAddOn = () => {
    setAddOns([
      ...addOns,
      {
        id: "",
        tempId: Math.random().toString(36).substr(2, 9),
        name: "",
        quantity: 1,
        unitPrice: 0,
        isCustom: false,
      },
    ])
  }

  const updateAddOn = (tempId: string, field: keyof AddOnItem, value: any) => {
    setAddOns(
      addOns.map((item) => {
        if (item.tempId !== tempId) return item

        if (field === "id") {
          // If selecting a template
          if (value === "custom") {
            return { ...item, id: "custom", name: "", unitPrice: 0, isCustom: true }
          }
          const template = mockAddOns.find((t) => t.id === value)
          if (template) {
            return {
              ...item,
              id: template.id,
              name: template.name,
              unitPrice: template.price,
              isCustom: false,
            }
          }
        }
        return { ...item, [field]: value }
      })
    )
  }

  const removeAddOn = (tempId: string) => {
    setAddOns(addOns.filter((item) => item.tempId !== tempId))
  }

  // --- 5. Discount ---
  const [discountType, setDiscountType] = useState<DiscountType>("VOUCHER")
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; amount: number } | null>(null)
  const [voucherError, setVoucherError] = useState("")
  
  const [manualMethod, setManualMethod] = useState<ManualDiscountMethod>("FIXED")
  const [manualValue, setManualValue] = useState(0)
  const [discountReason, setDiscountReason] = useState("")

  // --- 6. Staff ---
  const [staffId, setStaffId] = useState(mockCurrentUser.id)

  // --- Calculations ---
  const selectedPackage = useMemo(() => mockPackages.find((p) => p.id === packageId), [packageId])
  
  const subtotal = useMemo(() => {
    const pkgPrice = selectedPackage?.price || 0
    const addOnsPrice = addOns.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    return pkgPrice + addOnsPrice
  }, [selectedPackage, addOns])

  const discountAmount = useMemo(() => {
    if (discountType === "VOUCHER") {
      // Validate voucher logic mocking
      if (appliedVoucher) return appliedVoucher.amount
      return 0
    } else {
      if (manualMethod === "FIXED") return manualValue
      if (manualMethod === "PERCENTAGE") return (subtotal * manualValue) / 100
      return 0
    }
  }, [discountType, appliedVoucher, manualMethod, manualValue, subtotal])

  const finalTotal = Math.max(0, subtotal - discountAmount)

  // Voucher Validation Mock
  const validateVoucher = () => {
    const voucher = mockVouchers.find(v => v.code === voucherCode)
    if (voucher) {
      // Simple mock calculation
      let amt = 0
      if (voucher.discountType === "FIXED") amt = voucher.discountValue
      else amt = (subtotal * voucher.discountValue) / 100
      
      setAppliedVoucher({ code: voucherCode, amount: amt })
      setVoucherError("")
    } else {
      setVoucherError("Voucher tidak valid")
      setAppliedVoucher(null)
    }
  }

  // --- Mobile Summary ---
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)

  // --- Submit ---
  const handleSubmit = () => {
    // Basic validation
    if (!clientForm.name || !clientForm.phone ) {
        showToast("Mohon lengkapi data client", "warning")
        return
    }
    if (!sessionDate || !sessionTime || !packageId || !backgroundId) {
        showToast("Mohon lengkapi detail sesi", "warning")
        return
    }

    const payload = {
       client: clientForm,
       session: { date: sessionDate, time: sessionTime },
       packageId,
       backgroundId,
       addOns,
       discount: { type: discountType, amount: discountAmount, note: discountReason || appliedVoucher?.code },
       staffId,
       total: finalTotal
    }

    console.log("Creating Booking:", payload)

    // Simulate API call
    const orderId = `YJS-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(Math.random()*1000)}`

    // Show feedback
    showToast(`Booking berhasil dibuat! Order ID: ${orderId}`, "success")

    router.push("/dashboard/bookings")
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-10 relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/bookings"
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
          <p className="text-sm text-gray-500">Buat booking baru untuk client</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN - FORM */}
        <div className="flex-1 w-full space-y-8">
          
          {/* SECTION 1: CLIENT INFO */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#7A1F1F]" />
              Client Information
            </h2>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Cari nama atau nomor WA..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all"
              />
              {isClientFound && (
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                   Existing Client
                 </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={clientForm.instagram}
                    onChange={(e) => setClientForm({...clientForm, instagram: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                  />
               </div>
               <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
                  <textarea
                    rows={2}
                    value={clientForm.address}
                    onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none"
                  />
               </div>
            </div>
          </section>

          {/* SECTION 2: SCHEDULE */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#7A1F1F]" />
              Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Sesi <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                  />
                  {isTuesday && (
                    <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                       <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                       <p>Warning: Selasa adalah hari libur studio.</p>
                    </div>
                  )}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Waktu Sesi <span className="text-red-500">*</span></label>
                  <select
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="">Pilih Waktu</option>
                    {Array.from({ length: 25 }).map((_, i) => {
                      const hour = Math.floor(i / 2) + 8 // start 8:00
                      const min = i % 2 === 0 ? "00" : "30"
                      const time = `${hour.toString().padStart(2, '0')}:${min}`
                      if (hour > 20) return null
                      return <option key={time} value={time}>{time}</option>
                    })}
                  </select>
               </div>
            </div>
          </section>

          {/* SECTION 3: SESSION DETAILS */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7A1F1F]" />
              Session Details
            </h2>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Package <span className="text-red-500">*</span></label>
                  <select
                    value={packageId}
                    onChange={(e) => {
                        setPackageId(e.target.value)
                        // Auto set people count default if needed based on package? 
                        // For now keep at 1 or manual
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all appearance-none cursor-pointer bg-white"
                  >
                    <option value="">Pilih Paket Utama</option>
                    {mockPackages.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(p.price)}
                        </option>
                    ))}
                  </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Backdrop <span className="text-red-500">*</span></label>
                      <select
                        value={backgroundId}
                        onChange={(e) => setBackgroundId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all appearance-none cursor-pointer bg-white"
                      >
                        <option value="">Pilih Background</option>
                        {mockBackgrounds.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Orang <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min={1}
                        value={numPeople}
                        onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                      />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo For</label>
                      <input
                        type="text"
                        placeholder="Contoh: 1st Birthday, Graduation..."
                        value={photoFor}
                        onChange={(e) => setPhotoFor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
                      />
                  </div>
                   <div className="flex items-center h-full pt-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={btsVideo} 
                                onChange={(e) => setBtsVideo(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7A1F1F]/10 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7A1F1F]"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Include BTS Video</span>
                      </label>
                  </div>
               </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Catatan khusus dari customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none"
                  />
               </div>
            </div>
          </section>

          {/* SECTION 4: ADD-ONS */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#7A1F1F]" />
                    Add-ons
                </h2>
                <button
                    onClick={handleAddAddOn}
                    className="px-3 py-1.5 rounded-lg border border-[#7A1F1F] text-[#7A1F1F] text-sm font-medium hover:bg-[#7A1F1F]/5 transition-colors flex items-center gap-1.5"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                </button>
             </div>

             {addOns.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 rounded-l-lg">Item</th>
                                <th className="px-3 py-2 w-20">Qty</th>
                                <th className="px-3 py-2 w-32">Price</th>
                                <th className="px-3 py-2 w-32">Subtotal</th>
                                <th className="px-3 py-2 w-10 rounded-r-lg"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {addOns.map((item) => (
                                <tr key={item.tempId}>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-col gap-2">
                                            <select
                                                value={item.isCustom ? "custom" : item.id}
                                                onChange={(e) => updateAddOn(item.tempId, "id", e.target.value)}
                                                className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                            >
                                                <option value="">Pilih Item</option>
                                                {mockAddOns.map(ao => (
                                                    <option key={ao.id} value={ao.id}>{ao.name}</option>
                                                ))}
                                                <option value="custom">Custom Item...</option>
                                            </select>
                                            {item.isCustom && (
                                                <input
                                                    type="text"
                                                    placeholder="Nama item custom"
                                                    value={item.name}
                                                    onChange={(e) => updateAddOn(item.tempId, "name", e.target.value)}
                                                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateAddOn(item.tempId, "quantity", parseInt(e.target.value) || 1)}
                                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-3 align-top">
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            disabled={!item.isCustom}
                                            onChange={(e) => updateAddOn(item.tempId, "unitPrice", parseInt(e.target.value) || 0)}
                                            className={cn(
                                                "w-full p-2 rounded-lg border border-gray-200 text-sm",
                                                !item.isCustom && "bg-gray-50 text-gray-500"
                                            )}
                                        />
                                    </td>
                                    <td className="px-3 py-3 align-top font-medium">
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                    </td>
                                    <td className="px-3 py-3 align-top text-right">
                                        <button
                                            onClick={() => removeAddOn(item.tempId)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                             <tr>
                                 <td colSpan={3} className="px-3 py-4 text-right font-medium text-gray-500">Total Add-ons:</td>
                                 <td className="px-3 py-4 font-semibold text-gray-900 border-t border-gray-100">
                                     {formatCurrency(addOns.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0))}
                                 </td>
                                 <td></td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
             ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                    Belum ada add-ons
                </div>
             )}
          </section>

          {/* SECTION 5: DISCOUNT */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#7A1F1F]" />
              Discount
            </h2>
            
            <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="discountType" 
                        checked={discountType === "VOUCHER"} 
                        onChange={() => {
                            setDiscountType("VOUCHER")
                            setAppliedVoucher(null)
                        }}
                        className="text-[#7A1F1F] focus:ring-[#7A1F1F]"
                    />
                    <span className="text-sm font-medium">Voucher Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="discountType" 
                        checked={discountType === "MANUAL"} 
                        onChange={() => setDiscountType("MANUAL")}
                        className="text-[#7A1F1F] focus:ring-[#7A1F1F]"
                    />
                    <span className="text-sm font-medium">Manual Discount</span>
                </label>
            </div>

            {discountType === "VOUCHER" ? (
                <div className="flex items-start gap-2 max-w-md">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Masukkan kode voucher"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            className={cn(
                                "w-full px-4 py-2.5 rounded-xl border transition-all outline-none",
                                voucherError ? "border-red-300 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-[#7A1F1F]"
                            )}
                        />
                        {voucherError && <p className="text-xs text-red-500 mt-1">{voucherError}</p>}
                        {appliedVoucher && <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Voucher applied!</p>}
                    </div>
                    <button
                        onClick={validateVoucher}
                        className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        Apply
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-2">
                        <select
                           value={manualMethod}
                           onChange={(e) => setManualMethod(e.target.value as ManualDiscountMethod)}
                           className="w-32 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm"
                        >
                            <option value="FIXED">Rp (Fixed)</option>
                            <option value="PERCENTAGE">% (Persen)</option>
                        </select>
                        <input
                            type="number"
                            min={0}
                            value={manualValue}
                            onChange={(e) => setManualValue(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Alasan discount (opsional)"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                         className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                </div>
            )}
          </section>

           {/* SECTION 6: STAFF */}
           <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
             <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff in Charge
            </h2>
            <div className="max-w-xs">
                <select
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                    {mockStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">Staff yang dipilih akan tercatat untuk tracking komisi.</p>
            </div>
           </section>

        </div>

        {/* RIGHT COLUMN - SUMMARY (DESKTOP) */}
        <div className="hidden lg:block w-[360px] shrink-0">
           <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Ringkasan Harga</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6">
                 {/* Package */}
                 <div className="flex justify-between items-start">
                     <span className="font-medium text-gray-900">{selectedPackage ? selectedPackage.name : "Belum pilih paket"}</span>
                     <span>{formatCurrency(selectedPackage?.price || 0)}</span>
                 </div>

                 {/* Add-ons List */}
                 {addOns.length > 0 && (
                     <div className="pl-3 border-l-2 border-gray-100 space-y-2 py-1">
                         {addOns.map(item => (
                             <div key={item.tempId} className="flex justify-between text-xs">
                                 <span>{item.name || "Custom Item"} (x{item.quantity})</span>
                                 <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                             </div>
                         ))}
                     </div>
                 )}

                 <div className="border-t border-gray-100 my-2"></div>

                 {/* Subtotal */}
                 <div className="flex justify-between font-medium">
                     <span>Subtotal</span>
                     <span>{formatCurrency(subtotal)}</span>
                 </div>

                 {/* Discount */}
                 {discountAmount > 0 && (
                     <div className="flex justify-between text-green-600">
                         <span>Discount {appliedVoucher ? `(${appliedVoucher.code})` : ""}</span>
                         <span>-{formatCurrency(discountAmount)}</span>
                     </div>
                 )}
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-gray-900">TOTAL</span>
                      <span className="text-2xl font-bold text-[#7A1F1F]">{formatCurrency(finalTotal)}</span>
                  </div>
              </div>

              <div className="space-y-3">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3.5 bg-[#7A1F1F] text-white font-semibold rounded-xl hover:bg-[#9B3333] active:bg-[#5C1717] transition-all shadow-md hover:shadow-lg"
                  >
                      Create Booking
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                      Cancel
                  </button>
              </div>
           </div>
        </div>
      </div>

      {/* MOBILE STICKY SUMMARY BOTTOM BAR */}
      <div className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-100 rounded-t-2xl z-50 transition-all duration-300",
          isMobileSummaryOpen ? "h-[80vh]" : "h-auto"
      )}>
        {/* Handle for expanding */}
        <div 
            className="flex items-center justify-center pt-3 pb-1 cursor-pointer"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
        >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Collapsed View Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-100">
            <div>
                 <p className="text-xs text-gray-500 mb-0.5">Total Estimasi</p>
                 <button 
                    onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
                    className="flex items-center gap-2 font-bold text-xl text-[#7A1F1F]"
                 >
                     {formatCurrency(finalTotal)}
                     {isMobileSummaryOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                 </button>
            </div>
            <button
                onClick={handleSubmit}
                 className="px-6 py-2.5 bg-[#7A1F1F] text-white font-semibold rounded-xl hover:bg-[#9B3333]"
            >
                Create
            </button>
        </div>

        {/* Expanded Content */}
        {isMobileSummaryOpen && (
            <div className="p-6 overflow-y-auto h-[calc(100%-90px)]">
                 <h3 className="text-lg font-bold text-gray-900 mb-6">Ringkasan Harga</h3>
                  <div className="space-y-4 text-sm text-gray-600">
                     <div className="flex justify-between items-start">
                         <span className="font-medium text-gray-900">{selectedPackage ? selectedPackage.name : "Belum pilih paket"}</span>
                         <span>{formatCurrency(selectedPackage?.price || 0)}</span>
                     </div>
                     
                     {addOns.length > 0 && (
                         <div className="pl-3 border-l-2 border-gray-100 space-y-2 py-1">
                             {addOns.map(item => (
                                 <div key={item.tempId} className="flex justify-between text-xs">
                                     <span>{item.name || "Custom Item"} (x{item.quantity})</span>
                                     <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                                 </div>
                             ))}
                         </div>
                     )}

                     <div className="border-t border-gray-100 my-2"></div>

                     <div className="flex justify-between font-medium">
                         <span>Subtotal</span>
                         <span>{formatCurrency(subtotal)}</span>
                     </div>

                     {discountAmount > 0 && (
                         <div className="flex justify-between text-green-600">
                             <span>Discount {appliedVoucher ? `(${appliedVoucher.code})` : ""}</span>
                             <span>-{formatCurrency(discountAmount)}</span>
                         </div>
                     )}
                     
                      <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-end">
                            <span className="text-base font-bold text-gray-900">TOTAL</span>
                            <span className="text-2xl font-bold text-[#7A1F1F]">{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>
                  </div>
            </div>
        )}
      </div>
    </div>
  )
}
