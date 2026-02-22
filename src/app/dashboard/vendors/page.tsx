"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, DollarSign, FileText } from "lucide-react"
import { useVendors } from "@/lib/hooks/use-vendors"
import { useToast } from "@/lib/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface VendorForm {
  id?: string
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

export default function VendorsPage() {
  const { vendors, isLoading, mutate } = useVendors()
  const { showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVendor, setEditingVendor] = useState<any>(null)
  const [vendorToDelete, setVendorToDelete] = useState<any>(null)
  const [vendorForm, setVendorForm] = useState<VendorForm>({
    name: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isActive: true,
  })

  const resetForm = () => {
    setVendorForm({
      name: "",
      category: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      isActive: true,
    })
    setEditingVendor(null)
  }

  const handleOpenModal = (vendor?: any) => {
    if (vendor) {
      setEditingVendor(vendor)
      setVendorForm(vendor)
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
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors'
      const method = editingVendor ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save vendor')
      }

      showToast(`Vendor berhasil ${editingVendor ? 'diupdate' : 'ditambahkan'}`, "success")
      setIsModalOpen(false)
      resetForm()
      mutate()
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan vendor', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${vendorToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete vendor')
      }

      showToast('Vendor berhasil dihapus', 'success')
      setIsDeleteModalOpen(false)
      setVendorToDelete(null)
      mutate()
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus vendor', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Belum ada vendor. Tambahkan vendor pertama Anda!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{vendor.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[#F5ECEC] text-[#7A1F1F] text-xs font-medium rounded">
                    {vendor.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(vendor)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setVendorToDelete(vendor)
                      setIsDeleteModalOpen(true)
                    }}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{vendor.email}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{vendor.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Transaksi</p>
                  <p className="text-sm font-semibold text-gray-900">{vendor.transactionCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(vendor.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unpaid</p>
                  <p className="text-sm font-semibold text-red-600">{formatCurrency(vendor.unpaidExpenses)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Tambah Vendor Baru'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Vendor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MUA Salon Cantik"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                  >
                    <option value="">Pilih kategori</option>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                <textarea
                  placeholder="Alamat lengkap vendor"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea
                  placeholder="Catatan tambahan tentang vendor"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                    checked={vendorForm.isActive}
                    onChange={(e) => setVendorForm({ ...vendorForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Vendor aktif</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVendor}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#7A1F1F] text-white rounded-lg hover:bg-[#9B3333] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : editingVendor ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Vendor</h3>
            <p className="text-sm text-gray-600 mb-6">
              Yakin ingin menghapus vendor <span className="font-semibold">{vendorToDelete?.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setVendorToDelete(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVendor}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
