"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  X,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  AlertCircle,
  Download,
  FileSpreadsheet,
  ChevronDown
} from "lucide-react"
import * as XLSX from 'xlsx'
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
// import { useMobile } from "@/lib/hooks/use-mobile" // Assuming this exists or using simple check
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import { Pagination } from "@/components/shared/pagination"
import { useClients } from "@/lib/hooks/use-clients"
import { useAuth } from "@/lib/hooks/use-auth"
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client"
import { Client } from "@/lib/types"

// Extend Client type locally if types.ts not yet updated
type ClientWithStats = Client & {
  totalBookings?: number
  totalSpent?: number
  lastVisit?: string | null
}

type ClientFormData = {
  id?: string
  name: string
  phone: string
  email: string | null
  instagram: string | null
  address: string | null
  domisili: string | null
  leads: string | null
  notes: string | null
}

const ITEMS_PER_PAGE = 10

export default function ClientsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user } = useAuth()
  
  // Mobile check (simplified)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // State
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Use Hook
  const { clients, pagination, isLoading, mutate } = useClients({
      search: debouncedSearch,
      page: currentPage,
      limit: ITEMS_PER_PAGE
  })

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    address: "",
    domisili: "",
    leads: "",
    notes: ""
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])


  // Format phone for WhatsApp
  const formatPhoneForWA = (phone: string) => {
    return phone.replace(/^0/, '62').replace(/\D/g, '')
  }

  // Get relative time
  const getRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return "Belum ada sesi"

    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hari ini"
    if (diffDays === 1) return "Kemarin"
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`
    return formatDate(dateStr)
  }

  // Permissions
  const canDelete = user?.role === "OWNER"

  // CRUD Operations
  const handleAdd = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      instagram: "",
      address: "",
      domisili: "",
      leads: "",
      notes: ""
    })
    setAddModalOpen(true)
  }

  const handleEdit = (client: ClientWithStats) => {
    setSelectedClient(client)
    setFormData({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      instagram: client.instagram || "",
      address: client.address || "",
      domisili: client.domisili || "",
      leads: client.leads || "",
      notes: client.notes || ""
    })
    setEditModalOpen(true)
  }

  const handleDeleteClick = (client: ClientWithStats) => {
    setSelectedClient(client)
    setDeleteModalOpen(true)
  }

  const saveClient = async () => {
    if (!formData.name || !formData.phone) {
      showToast("Nama dan nomor WhatsApp wajib diisi", "warning")
      return
    }

    setIsSubmitting(true)
    try {
        if (formData.id) {
            // Update
            const res = await apiPatch(`/api/clients/${formData.id}`, formData)
            if (res.error) throw new Error(res.error)
            showToast(`Client ${formData.name} berhasil diupdate`, "success")
            setEditModalOpen(false)
        } else {
            // Create
            const res = await apiPost("/api/clients", formData)
            if (res.error) throw new Error(res.error)
            showToast(`Client ${formData.name} berhasil ditambahkan`, "success")
            setAddModalOpen(false)
        }
        mutate() // Refresh list
    } catch (error: any) {
        console.error(error)
        showToast(error.message || "Gagal menyimpan client", "error")
    } finally {
        setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedClient) return
    const { id, name } = selectedClient
    // Optimistic: remove from cache immediately
    setDeleteModalOpen(false)
    setSelectedClient(null)
    mutate(
      (current: any) => current ? {
        ...current,
        data: current.data.filter((c: any) => c.id !== id)
      } : current,
      false
    )
    try {
        const res = await apiDelete(`/api/clients/${id}`)
        if (res.error) throw new Error(res.error)
        showToast(`Client ${name} berhasil dihapus`, "success")
        // No mutate() — optimistic update already removed it from cache
    } catch (error: any) {
        mutate() // rollback: re-fetch to restore the item
        showToast(error.message || "Gagal menghapus client", "error")
    }
  }

  // Export functions
  const handleExportCSV = () => {
    if (!clients || clients.length === 0) {
      showToast("Tidak ada data untuk diexport", "error")
      return
    }

    // Prepare data for CSV
    const csvData = clients.map((client: any) => ({
      'Nama': client.name,
      'No. WhatsApp': client.phone,
      'Email': client.email || '-',
      'Instagram': client.instagram || '-',
      'Alamat': client.address || '-',
      'Domisili': client.domisili || '-',
      'Leads (Sumber)': client.leads || '-',
      'Total Bookings': client.totalBookings || 0,
      'Total Spent': client.totalSpent || 0,
      'Last Visit': client.lastVisit ? formatDate(client.lastVisit) : '-',
      'Catatan': client.notes || '-'
    }))

    // Convert to CSV string
    const headers = Object.keys(csvData[0]).join(',')
    const rows = csvData.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers, ...rows].join('\n')

    // Download CSV
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    showToast("Data berhasil diexport ke CSV", "success")
  }

  const handleExportExcel = () => {
    if (!clients || clients.length === 0) {
      showToast("Tidak ada data untuk diexport", "error")
      return
    }

    // Prepare data for Excel
    const excelData = clients.map((client: any) => ({
      'Nama': client.name,
      'No. WhatsApp': client.phone,
      'Email': client.email || '-',
      'Instagram': client.instagram || '-',
      'Alamat': client.address || '-',
      'Domisili': client.domisili || '-',
      'Leads (Sumber)': client.leads || '-',
      'Total Bookings': client.totalBookings || 0,
      'Total Spent': client.totalSpent || 0,
      'Last Visit': client.lastVisit ? formatDate(client.lastVisit) : '-',
      'Catatan': client.notes || '-'
    }))

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clients')

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Nama
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 15 }, // Instagram
      { wch: 30 }, // Alamat
      { wch: 20 }, // Domisili
      { wch: 20 }, // Leads
      { wch: 12 }, // Total Bookings
      { wch: 15 }, // Total Spent
      { wch: 12 }, // Last Visit
      { wch: 30 }  // Catatan
    ]

    // Download Excel
    XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`)

    showToast("Data berhasil diexport ke Excel", "success")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Clients</h1>
          <p className="text-sm text-[#6B7280] mt-1">
             {pagination?.total || 0} total klien
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] text-sm font-semibold hover:bg-[#F9FAFB] hover:border-[#7A1F1F]/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-10">
                <button
                  onClick={() => { handleExportCSV(); setExportOpen(false) }}
                  disabled={!clients || clients.length === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#111827] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-t-xl"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#10B981]" />
                  <span>Export sebagai CSV</span>
                </button>
                <button
                  onClick={() => { handleExportExcel(); setExportOpen(false) }}
                  disabled={!clients || clients.length === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#111827] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-b-xl"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#059669]" />
                  <span>Export sebagai Excel</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, nomor WA, atau email..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && clients.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm animate-pulse">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                {["Name", "Phone", "Email", "Total Bookings", "Total Spent", "Last Visit", ""].map((h) => (
                  <th key={h} className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-16" /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="h-3 bg-gray-200 rounded w-28" />
                    </div>
                  </td>
                  <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-36" /></td>
                  <td className="py-3 px-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-8 mx-auto" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-24 ml-auto" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                  <td className="py-3 px-4"><div className="h-7 bg-gray-200 rounded w-16 mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
          <>
            {/* Desktop Table */}
            {!isMobile ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Phone</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Email</th>
                        <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Total Bookings</th>
                        <th className="text-right py-3 px-4 font-medium text-[#6B7280]">Total Spent</th>
                        <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Last Visit</th>
                        <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client: any) => (
                        <tr
                            key={client.id}
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                            onMouseEnter={() => router.prefetch(`/dashboard/clients/${client.id}`)}
                            className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        >
                            <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#F5ECEC] flex items-center justify-center text-xs font-semibold text-[#7A1F1F] shrink-0">
                                {getInitials(client.name)}
                                </div>
                                <span className="font-semibold text-[#111827]">{client.name}</span>
                            </div>
                            </td>
                            <td className="py-3 px-4">
                            <a
                                href={`https://wa.me/${formatPhoneForWA(client.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F] transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                <span>{client.phone}</span>
                            </a>
                            </td>
                            <td className="py-3 px-4">
                            {client.email ? (
                                <a
                                href={`mailto:${client.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F] transition-colors"
                                >
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">{client.email}</span>
                                </a>
                            ) : (
                                <span className="text-[#9CA3AF]">—</span>
                            )}
                            </td>
                            <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                                {client.totalBookings || 0}
                            </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                            {formatCurrency(client.totalSpent || 0)}
                            </td>
                            <td className="py-3 px-4 text-[#6B7280]">
                            {getRelativeTime(client.lastVisit)}
                            </td>
                            <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                                <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/dashboard/clients/${client.id}`)
                                }}
                                className="p-1.5 text-gray-500 hover:text-[#7A1F1F] hover:bg-red-50 rounded-lg transition-colors"
                                title="View"
                                >
                                <Eye className="h-4 w-4" />
                                </button>
                                <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(client)
                                }}
                                className="p-1.5 text-gray-500 hover:text-[#7A1F1F] hover:bg-red-50 rounded-lg transition-colors"
                                title="Edit"
                                >
                                <Edit className="h-4 w-4" />
                                </button>
                                {canDelete && (
                                <button
                                    onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClick(client)
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                )}
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
            ) : (
                /* Mobile Cards */
                <div className="space-y-3">
                {clients.map((client: any) => (
                    <div
                    key={client.id}
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    onMouseEnter={() => router.prefetch(`/dashboard/clients/${client.id}`)}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:shadow-sm transition-shadow"
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F5ECEC] flex items-center justify-center text-sm font-semibold text-[#7A1F1F] shrink-0">
                            {getInitials(client.name)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#111827]">{client.name}</p>
                        </div>
                        </div>
                        <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(client)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        >
                        <Edit className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="space-y-2 text-xs mb-3">
                        <a
                        href={`https://wa.me/${formatPhoneForWA(client.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F]"
                        >
                        <Phone className="h-3 w-3" /> {client.phone}
                        </a>
                        {client.email && (
                        <a
                            href={`mailto:${client.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-[#6B7280] hover:text-[#7A1F1F] truncate"
                        >
                            <Mail className="h-3 w-3" /> {client.email}
                        </a>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                        <div className="text-xs text-[#6B7280]">
                        <span className="font-medium">{client.totalBookings || 0} bookings</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium text-[#7A1F1F]">{formatCurrency(client.totalSpent || 0)}</span>
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                        {getRelativeTime(client.lastVisit)}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}

            {/* Empty State */}
            {clients.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                    {search ? "Tidak ada client ditemukan" : "Belum ada client"}
                </p>
                {!search && (
                    <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1F1F] text-white text-sm font-medium hover:bg-[#9B3333] transition-colors"
                    >
                    <Plus className="h-4 w-4" />
                    Tambah Client Pertama
                    </button>
                )}
                </div>
            )}

            {/* Pagination */}
            {pagination && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
          </>
      )}

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setEditModalOpen(false)
        }}
        title={editModalOpen ? "Edit Client" : "Add New Client"}
        description={editModalOpen ? "Update client information" : "Add a new client to your database"}
        onConfirm={saveClient}
        isLoading={isSubmitting}
        confirmLabel={editModalOpen ? "Update" : "Save"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Instagram</label>
            <input
              type="text"
              value={formData.instagram || ""}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="@username"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Alamat</label>
            <textarea
              rows={2}
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none placeholder:text-gray-400"
              placeholder="Alamat lengkap client"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Domisili</label>
            <input
              type="text"
              value={formData.domisili || ""}
              onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="Kota/Kabupaten"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Leads (Sumber)</label>
            <input
              type="text"
              value={formData.leads || ""}
              onChange={(e) => setFormData({ ...formData, leads: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all placeholder:text-gray-400"
              placeholder="Instagram, TikTok, Referral, dll"
            />
          </div>

           <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Catatan</label>
            <textarea
              rows={2}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none placeholder:text-gray-400"
              placeholder="Internal notes..."
            />
          </div>
        </div>


      </Modal>

      {/* Delete Confirmation Modal */}
      {selectedClient && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={`Hapus client ${selectedClient.name}?`}
          description="Booking history client ini akan tetap tersimpan (jika ada), namun client tidak bisa dipilih lagi. Jika client memiliki booking aktif, mungkin tidak bisa dihapus."
          confirmLabel={isSubmitting ? "Deleting..." : "Delete"}
          onConfirm={confirmDelete}
          variant="danger"
        />
      )}
    </div>
  )
}
