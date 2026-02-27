"use client"

import { useState, useMemo } from "react"
import {
  Plus, Edit2, Trash2, Phone, Mail, MapPin, X,
  ChevronRight, Loader2, CheckCircle2, Circle, ExternalLink,
} from "lucide-react"
import { useVendors, useVendorDetail, VendorWithStats } from "@/lib/hooks/use-vendors"
import { useToast } from "@/lib/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client"

interface VendorForm {
  name: string
  category: string
  phone: string
  email: string
  address: string
  notes: string
  isActive: boolean
}

const VENDOR_CATEGORIES = [
  "MUA",
  "Canvas Print",
  "Hairdo",
  "Props",
  "Packaging",
  "Equipment",
  "Other",
]

const CATEGORY_COLORS: Record<string, string> = {
  MUA: "bg-pink-50 text-pink-700 border-pink-200",
  "Canvas Print": "bg-orange-50 text-orange-700 border-orange-200",
  Hairdo: "bg-purple-50 text-purple-700 border-purple-200",
  Props: "bg-green-50 text-green-700 border-green-200",
  Packaging: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Equipment: "bg-blue-50 text-blue-700 border-blue-200",
  Other: "bg-gray-50 text-gray-700 border-gray-200",
}

function CategoryBadge({ category }: { category: string }) {
  const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {category}
    </span>
  )
}

function VendorDetailPanel({
  vendorId,
  onClose,
  onEdit,
}: {
  vendorId: string
  onClose: () => void
  onEdit: (v: VendorWithStats) => void
}) {
  const { vendor, isLoading } = useVendorDetail(vendorId)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Detail Vendor</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : !vendor ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Vendor tidak ditemukan
          </div>
        ) : (
          <>
            {/* Vendor Info */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                  <div className="mt-1">
                    <CategoryBadge category={vendor.category} />
                  </div>
                </div>
                <button
                  onClick={() => onEdit(vendor)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <a href={`tel:${vendor.phone}`} className="hover:text-[#7A1F1F]">{vendor.phone}</a>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <a href={`mailto:${vendor.email}`} className="hover:text-[#7A1F1F]">{vendor.email}</a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                    <span>{vendor.address}</span>
                  </div>
                )}
              </div>

              {vendor.notes && (
                <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{vendor.notes}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{vendor.transactionCount}</p>
                <p className="text-xs text-gray-500 mt-1">Transaksi</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(vendor.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-bold text-red-600">{formatCurrency(vendor.unpaidExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">Belum Lunas</p>
              </div>
            </div>

            {/* Expense History */}
            <div className="flex-1">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700">Riwayat Transaksi</h4>
              </div>

              {vendor.expenses.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Belum ada transaksi untuk vendor ini
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {vendor.expenses.map((expense) => (
                    <div key={expense.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(expense.date)}</p>
                          {expense.relatedBooking && (
                            <p className="text-xs text-[#7A1F1F] mt-1 font-mono">
                              {expense.relatedBooking.bookingCode} — {expense.relatedBooking.client.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                          {expense.vendorPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                              <Circle className="h-3 w-3" />
                              Belum lunas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const { vendors, isLoading, mutate } = useVendors()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorWithStats | null>(null)
  const [vendorToDelete, setVendorToDelete] = useState<VendorWithStats | null>(null)
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

  // Category filter
  const [activeCategory, setActiveCategory] = useState<string>("ALL")

  const [vendorForm, setVendorForm] = useState<VendorForm>({
    name: "", category: "", phone: "", email: "", address: "", notes: "", isActive: true,
  })

  const resetForm = () => {
    setVendorForm({ name: "", category: "", phone: "", email: "", address: "", notes: "", isActive: true })
    setEditingVendor(null)
  }

  const handleOpenModal = (vendor?: VendorWithStats) => {
    if (vendor) {
      setEditingVendor(vendor)
      setVendorForm({
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        notes: vendor.notes || "",
        isActive: vendor.isActive,
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.category) {
      showToast("Nama dan kategori wajib diisi", "warning")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingVendor) {
        const res = await apiPatch(`/api/vendors/${editingVendor.id}`, vendorForm)
        if (res.error) throw new Error(res.error)
      } else {
        const res = await apiPost("/api/vendors", vendorForm)
        if (res.error) throw new Error(res.error)
      }

      showToast(`Vendor berhasil ${editingVendor ? "diupdate" : "ditambahkan"}`, "success")
      setIsModalOpen(false)
      resetForm()
      mutate()
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan vendor", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return

    setIsSubmitting(true)
    try {
      const res = await apiDelete(`/api/vendors/${vendorToDelete.id}`)
      if (res.error) throw new Error(res.error)

      showToast("Vendor berhasil dihapus", "success")
      setIsDeleteModalOpen(false)
      setVendorToDelete(null)
      mutate()
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus vendor", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique categories from vendors
  const availableCategories = useMemo(() => {
    const cats = new Set(vendors.map((v) => v.category))
    return Array.from(cats).sort()
  }, [vendors])

  const filteredVendors = useMemo(() => {
    if (activeCategory === "ALL") return vendors
    return vendors.filter((v) => v.category === activeCategory)
  }, [vendors, activeCategory])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola vendor MUA, canvas, hairdo, dan lainnya</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7A1F1F] text-white rounded-lg hover:bg-[#9B3333] transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Vendor
        </button>
      </div>

      {/* Category Filter Chips */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === "ALL"
                ? "bg-[#7A1F1F] text-white border-[#7A1F1F]"
                : "bg-white text-gray-600 border-gray-300 hover:border-[#7A1F1F] hover:text-[#7A1F1F]"
            }`}
          >
            Semua ({vendors.length})
          </button>
          {availableCategories.map((cat) => {
            const count = vendors.filter((v) => v.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat
                    ? "bg-[#7A1F1F] text-white border-[#7A1F1F]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-[#7A1F1F] hover:text-[#7A1F1F]"
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Vendor Grid */}
      {isLoading && vendors.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-5 bg-gray-200 rounded-full w-20" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-5 bg-gray-200 rounded mx-auto w-8" />
                    <div className="h-3 bg-gray-200 rounded w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">
            {vendors.length === 0
              ? "Belum ada vendor. Tambahkan vendor pertama Anda!"
              : `Tidak ada vendor dengan kategori "${activeCategory}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedVendorId(vendor.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#7A1F1F] transition-colors">
                    {vendor.name}
                  </h3>
                  <div className="mt-1.5">
                    <CategoryBadge category={vendor.category} />
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenModal(vendor)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setVendorToDelete(vendor)
                      setIsDeleteModalOpen(true)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{vendor.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{vendor.transactionCount}</p>
                  <p className="text-xs text-gray-400">Transaksi</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(vendor.totalExpenses)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-500">{formatCurrency(vendor.unpaidExpenses)}</p>
                  <p className="text-xs text-gray-400">Unpaid</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs text-gray-400 group-hover:text-[#7A1F1F] transition-colors">
                <span>Lihat detail</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Detail Side Panel */}
      {selectedVendorId && (
        <VendorDetailPanel
          vendorId={selectedVendorId}
          onClose={() => setSelectedVendorId(null)}
          onEdit={(v) => {
            setSelectedVendorId(null)
            handleOpenModal(v)
          }}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingVendor ? "Edit Vendor" : "Tambah Vendor Baru"}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); resetForm() }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Vendor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MUA Salon Cantik"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                  >
                    <option value="">Pilih kategori</option>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
                <textarea
                  placeholder="Alamat lengkap vendor"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
                <textarea
                  placeholder="Catatan tambahan tentang vendor"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                  checked={vendorForm.isActive}
                  onChange={(e) => setVendorForm({ ...vendorForm, isActive: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Vendor aktif</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={() => { setIsModalOpen(false); resetForm() }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                onClick={handleSaveVendor}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm hover:bg-[#9B3333] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : editingVendor ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Vendor</h3>
            <p className="text-sm text-gray-600 mb-6">
              Yakin ingin menghapus vendor <span className="font-semibold">{vendorToDelete?.name}</span>?
              Vendor yang memiliki transaksi tidak dapat dihapus.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setVendorToDelete(null) }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteVendor}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
