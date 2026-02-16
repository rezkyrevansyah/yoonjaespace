"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Phone,
  Mail,
  Instagram,
  MapPin,
  MessageCircle,
  Edit,
  Trash2,
  CalendarCheck,
  DollarSign,
  Clock,
  Camera,
  Calendar,
  Plus
} from "lucide-react"
import { mockClients, mockBookings, mockCurrentUser } from "@/lib/mock-data"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { useToast } from "@/lib/hooks/use-toast"
import { useMobile } from "@/lib/hooks/use-mobile"
import { StatusBadge } from "@/components/shared/status-badge"
import { Modal } from "@/components/shared/modal"

type ClientFormData = {
  id: string
  name: string
  phone: string
  email: string
  instagram: string
  address: string
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useToast()
  const isMobile = useMobile()

  const [client, setClient] = useState(() => mockClients.find((c) => c.id === id))
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState<ClientFormData>({
    id: "",
    name: "",
    phone: "",
    email: "",
    instagram: "",
    address: ""
  })

  if (!client) {
    return (
      <div className="page-container text-center py-16">
        <p className="text-lg font-medium text-[#111827]">Client tidak ditemukan</p>
        <Link href="/dashboard/clients" className="text-sm text-[#7A1F1F] hover:text-[#9B3333] mt-2 inline-block">
          Kembali ke daftar client
        </Link>
      </div>
    )
  }

  const clientBookings = useMemo(() => mockBookings.filter((b) => b.client.id === id), [id])
  const totalBookings = clientBookings.filter(b => b.status !== "CANCELLED").length
  const totalSpent = clientBookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + b.paidAmount, 0)

  const lastVisit = useMemo(() => {
    const completedBookings = [...clientBookings]
      .filter(b => b.status !== "CANCELLED")
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())

    return completedBookings.length > 0 ? completedBookings[0].sessionDate : null
  }, [clientBookings])

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

  // Format phone for WhatsApp
  const formatPhoneForWA = (phone: string) => {
    return phone.replace(/^0/, '62')
  }

  // Permissions
  const canDelete = mockCurrentUser.role === "OWNER"

  // Handlers
  const handleEdit = () => {
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

  const handleDeleteClick = () => {
    setDeleteModalOpen(true)
  }

  const saveClient = () => {
    if (!formData.name || !formData.phone) {
      showToast("Nama dan nomor WhatsApp wajib diisi", "warning")
      return
    }

    // Update client
    setClient({
      ...client,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      instagram: formData.instagram || null,
      address: formData.address || null
    })

    showToast(`Client ${formData.name} berhasil diupdate`, "success")
    setEditModalOpen(false)
  }

  const confirmDelete = () => {
    showToast(`Client ${client.name} berhasil dihapus`, "success")
    setDeleteModalOpen(false)
    router.push("/dashboard/clients")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/clients"
            className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">{client.name}</h1>
            <p className="text-sm text-[#6B7280] mt-1">Klien sejak {formatDate(client.createdAt)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <a
            href={`https://wa.me/${formatPhoneForWA(client.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WA Client
          </a>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Mobile Action buttons */}
      <div className="sm:hidden flex items-center gap-2">
        <a
          href={`https://wa.me/${formatPhoneForWA(client.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#F5ECEC] flex items-center justify-center text-2xl font-bold text-[#7A1F1F] mb-3">
                {getInitials(client.name)}
              </div>
              <h3 className="text-xl font-bold text-[#111827]">{client.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Client ID: {client.id}</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a
                href={`https://wa.me/${formatPhoneForWA(client.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                <span className="text-[#111827]">{client.phone}</span>
              </a>

              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                  <span className="text-[#111827] truncate">{client.email}</span>
                </a>
              )}

              {client.instagram && (
                <a
                  href={`https://instagram.com/${client.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                  <span className="text-[#111827]">{client.instagram}</span>
                </a>
              )}

              {client.address && (
                <div className="flex items-start gap-3 text-sm p-2">
                  <MapPin className="h-4 w-4 text-[#9CA3AF] shrink-0 mt-0.5" />
                  <span className="text-[#111827]">{client.address}</span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 rounded-lg border border-[#7A1F1F] text-[#7A1F1F] hover:bg-[#7A1F1F]/5 text-sm font-medium transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Right Column - Stats & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Bookings */}
            <div className="rounded-xl border border-[#E5E7EB] bg-blue-50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900">{totalBookings}</p>
            </div>

            {/* Total Spent */}
            <div className="rounded-xl border border-[#E5E7EB] bg-green-50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Spent</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSpent)}</p>
            </div>

            {/* Last Visit */}
            <div className="rounded-xl border border-[#E5E7EB] bg-amber-50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Last Visit</p>
                </div>
              </div>
              <p className="text-lg font-bold text-amber-900">{getRelativeTime(lastVisit)}</p>
            </div>
          </div>

          {/* Booking History */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#111827]">Booking History</h3>
              <Link
                href={`/dashboard/bookings/new?clientId=${client.id}`}
                className="text-sm text-[#7A1F1F] hover:text-[#9B3333] font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                New Booking
              </Link>
            </div>

            {clientBookings.length > 0 ? (
              <>
                {/* Desktop Table */}
                {!isMobile ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Booking ID</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Date</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Package</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Payment</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3">
                              <span className="font-mono text-[#7A1F1F] font-medium">{booking.bookingCode}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-600">{formatDate(booking.sessionDate)}</td>
                            <td className="py-3 px-3 text-gray-600">{booking.sessionTime}</td>
                            <td className="py-3 px-3 text-gray-900">{booking.package.name}</td>
                            <td className="py-3 px-3">
                              <StatusBadge status={booking.status} size="sm" />
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-900">
                              {formatCurrency(booking.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Cards */
                  <div className="space-y-3">
                    {clientBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/dashboard/bookings/${booking.id}`}
                        className="flex items-start gap-4 p-4 rounded-lg border border-[#E5E7EB] hover:shadow-sm transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center shrink-0">
                          <Camera className="h-5 w-5 text-[#7A1F1F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-[#7A1F1F]">{booking.bookingCode}</p>
                            <StatusBadge status={booking.status} size="sm" />
                          </div>
                          <p className="text-sm text-[#111827] mb-2">{booking.package.name}</p>
                          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.sessionDate)}
                            </span>
                            <span>{booking.sessionTime}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <StatusBadge status={booking.paymentStatus} type="payment" size="sm" />
                            <span className="text-sm font-semibold text-[#7A1F1F]">
                              {formatCurrency(booking.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Belum ada booking dari client ini</p>
                <Link
                  href={`/dashboard/bookings/new?clientId=${client.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A1F1F] text-white text-sm font-medium hover:bg-[#9B3333] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Buat Booking
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Client"
        description="Update client information"
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] outline-none transition-all resize-none"
              placeholder="Alamat lengkap client"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setEditModalOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveClient}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#7A1F1F] text-white font-medium hover:bg-[#9B3333] transition-colors"
          >
            Update
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Hapus client ${client.name}?`}
        description="Booking history akan tetap ada, tapi client tidak bisa dipilih lagi untuk booking baru."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="danger"
      />
    </div>
  )
}
