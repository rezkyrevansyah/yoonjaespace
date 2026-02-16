"use client"

import { useState, useMemo, useEffect } from "react"
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
  Users
} from "lucide-react"
import { mockClients, mockBookings, mockCurrentUser } from "@/lib/mock-data"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import { Pagination } from "@/components/shared/pagination"

type ClientFormData = {
  id?: string
  name: string
  phone: string
  email: string | null
  instagram: string | null
  address: string | null
}

const ITEMS_PER_PAGE = 10

export default function ClientsPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const { showToast } = useToast()

  const [clients, setClients] = useState(mockClients)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientFormData | null>(null)

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    email: "",
    instagram: "",
    address: ""
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Calculate stats for each client
  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      const clientBookings = mockBookings.filter(b => b.client.id === client.id && b.status !== "CANCELLED")
      const totalSpent = clientBookings.reduce((sum, b) => sum + b.paidAmount, 0)
      const lastVisit = clientBookings.length > 0
        ? clientBookings.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0].sessionDate
        : null

      return {
        ...client,
        totalBookings: clientBookings.length,
        totalSpent,
        lastVisit
      }
    })
  }, [clients])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clientsWithStats.filter((c) =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.phone.includes(debouncedSearch) ||
      (c.email && c.email.toLowerCase().includes(debouncedSearch.toLowerCase()))
    )
  }, [clientsWithStats, debouncedSearch])

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Format phone for WhatsApp
  const formatPhoneForWA = (phone: string) => {
    return phone.replace(/^0/, '62')
  }

  // Get relative time
  const getRelativeTime = (dateStr: string | null) => {
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
  const canDelete = mockCurrentUser.role === "OWNER"

  // CRUD Operations
  const handleAdd = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      instagram: "",
      address: ""
    })
    setAddModalOpen(true)
  }

  const handleEdit = (client: { id: string, name: string, phone: string, email?: string | null, instagram?: string | null, address?: string | null }) => {
    setFormData({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      instagram: client.instagram || "",
      address: client.address || ""
    })
    setEditModalOpen(true)
  }

  const handleDeleteClick = (client: ClientFormData) => {
    setSelectedClient(client)
    setDeleteModalOpen(true)
  }

  const saveClient = () => {
    if (!formData.name || !formData.phone) {
      showToast("Nama dan nomor WhatsApp wajib diisi", "warning")
      return
    }

    if (formData.id) {
      // Update existing
      setClients(prev => prev.map(c =>
        c.id === formData.id
          ? { ...c, ...formData }
          : c
      ))
      showToast(`Client ${formData.name} berhasil diupdate`, "success")
      setEditModalOpen(false)
    } else {
      // Create new
      const newClient = {
        id: `cl-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        instagram: formData.instagram || null,
        address: formData.address || null,
        notes: null,
        totalBookings: 0,
        createdAt: new Date().toISOString()
      }
      setClients(prev => [newClient, ...prev])
      showToast(`Client ${formData.name} berhasil ditambahkan`, "success")
      setAddModalOpen(false)
    }
  }

  const confirmDelete = () => {
    if (selectedClient) {
      setClients(prev => prev.filter(c => c.id !== selectedClient.id))
      showToast(`Client ${selectedClient.name} berhasil dihapus`, "success")
      setDeleteModalOpen(false)
      setSelectedClient(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Clients</h1>
          <p className="text-sm text-[#6B7280] mt-1">{clients.length} total klien</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
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

      {/* Results count */}
      <div className="text-xs text-[#9CA3AF]">
        <p>
          Menampilkan {filteredClients.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredClients.length)} dari {filteredClients.length} klien
        </p>
      </div>

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
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
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
                        {client.totalBookings}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#111827]">
                      {formatCurrency(client.totalSpent)}
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
          {paginatedClients.map((client) => (
            <div
              key={client.id}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
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
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="h-5 w-5" />
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
                  <span className="font-medium">{client.totalBookings} bookings</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium text-[#7A1F1F]">{formatCurrency(client.totalSpent)}</span>
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
      {filteredClients.length === 0 && (
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false)
          setEditModalOpen(false)
        }}
        title={editModalOpen ? "Edit Client" : "Add New Client"}
        description={editModalOpen ? "Update client information" : "Add a new client to your database"}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
            <input
              type="text"
              value={formData.instagram || ""}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
            <textarea
              rows={3}
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none"
              placeholder="Alamat lengkap client"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => {
              setAddModalOpen(false)
              setEditModalOpen(false)
            }}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveClient}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#7A1F1F] text-white font-medium hover:bg-[#9B3333] transition-colors"
          >
            {editModalOpen ? "Update" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {selectedClient && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title={`Hapus client ${selectedClient.name}?`}
          description="Booking history akan tetap ada, tapi client tidak bisa dipilih lagi untuk booking baru."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          variant="danger"
        />
      )}
    </div>
  )
}
