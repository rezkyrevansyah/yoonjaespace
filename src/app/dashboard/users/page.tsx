"use client"

import { useState } from "react"
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone as PhoneIcon,
  Eye,
  EyeOff,
  Calendar,
  Circle
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { formatDate, getInitials } from "@/lib/utils"
import { USER_ROLE_MAP } from "@/lib/constants"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { useUsers } from "@/lib/hooks/use-users"
import { Modal } from "@/components/shared/modal"
import type { StaffUser, UserRole } from "@/lib/types"

const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "PACKAGING_STAFF", label: "Packaging Staff" }
]

interface UserFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: UserRole
  isActive: boolean
}

export default function UsersPage() {
  const isMobile = useMobile()
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()
  const { users, isLoading, createUser, updateUser, deleteUser } = useUsers()

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Selected user
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null)

  // Form states
  const [userForm, setUserForm] = useState<Partial<UserFormData>>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN",
    isActive: true
  })

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Reset password state for edit
  const [resetPassword, setResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  // Handle add user
  const handleAddUser = async () => {
    // Validation
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.confirmPassword) {
      showToast("Mohon lengkapi semua field yang wajib", "warning")
      return
    }

    if (userForm.password.length < 8) {
      showToast("Password minimal 8 karakter", "warning")
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      showToast("Password dan confirm password tidak cocok", "warning")
      return
    }

    // Check email unique
    if (users.some(u => u.email.toLowerCase() === userForm.email?.toLowerCase())) {
      showToast("Email sudah terdaftar", "warning")
      return
    }

    const success = await createUser({
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone || "",
      password: userForm.password,
      role: userForm.role!,
      isActive: userForm.isActive !== undefined ? userForm.isActive : true
    })

    if (success) {
      setAddModalOpen(false)
      setUserForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "ADMIN",
        isActive: true
      })
    }
  }

  // Handle edit user
  const handleEditUser = async () => {
    if (!editingUser || !userForm.name) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    // If reset password is checked, validate new password
    if (resetPassword) {
      if (!newPassword) {
        showToast("Mohon masukkan password baru", "warning")
        return
      }
      if (newPassword.length < 8) {
        showToast("Password minimal 8 karakter", "warning")
        return
      }
    }

    const success = await updateUser(editingUser.id, {
      name: userForm.name,
      phone: userForm.phone,
      role: userForm.role,
      isActive: userForm.isActive,
      ...(resetPassword && newPassword ? { password: newPassword } : {})
    })

    if (success) {
      setEditModalOpen(false)
      setEditingUser(null)
      setUserForm({})
      setResetPassword(false)
      setNewPassword("")
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    if (userToDelete.role === "OWNER") {
      showToast("Owner tidak bisa dihapus", "warning")
      return
    }

    if (userToDelete.id === currentUser?.id) {
      showToast("Anda tidak bisa menghapus akun sendiri", "warning")
      return
    }

    await deleteUser(userToDelete.id, userToDelete.name)
    setDeleteModalOpen(false)
    setUserToDelete(null)
  }

  // Open edit modal
  const openEditModal = (user: StaffUser) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      password: "",
      confirmPassword: ""
    })
    setResetPassword(false)
    setNewPassword("")
    setEditModalOpen(true)
  }

  // Open delete modal
  const openDeleteModal = (user: StaffUser) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  // Check if user can be deleted
  const canDeleteUser = (user: StaffUser) => {
    return user.role !== "OWNER" && user.id !== currentUser?.id
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#7A1F1F]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">User Management</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Kelola akses staf studio
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setUserForm({
              name: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
              role: "ADMIN",
              isActive: true
            })
            setAddModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
        >
          <Plus className="h-4 w-4" />
          {!isMobile && "Add User"}
        </button>
      </div>

      {/* Desktop Table */}
      {!isMobile ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Email</th>
                <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Role</th>
                <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Status</th>
                <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Created</th>
                <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleConfig = USER_ROLE_MAP[user.role] || { label: user.role, color: "#6B7280", bgColor: "#F3F4F6" }
                const isOwner = user.role === "OWNER"
                const isCurrentUser = user.id === currentUser?.id

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors ${
                      isOwner ? "bg-[#F5ECEC]" : ""
                    }`}
                  >
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F5ECEC] flex items-center justify-center text-xs font-semibold text-[#7A1F1F] shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#111827]">{user.name}</span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7A1F1F] text-white">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-[#6B7280]">{user.email}</td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ color: roleConfig.color, backgroundColor: roleConfig.bgColor }}
                      >
                        {roleConfig.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Circle
                          className={`h-2 w-2 fill-current ${
                            user.isActive ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <span className={`text-sm ${user.isActive ? "text-green-600" : "text-gray-500"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-[#6B7280]">{formatDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {canDeleteUser(user) ? (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile Cards */
        <div className="space-y-3">
          {users.map((user) => {
            const roleConfig = USER_ROLE_MAP[user.role] || { label: user.role, color: "#6B7280", bgColor: "#F3F4F6" }
            const isOwner = user.role === "OWNER"
            const isCurrentUser = user.id === currentUser?.id

            return (
              <div
                key={user.id}
                className={`p-4 rounded-xl border border-[#E5E7EB] bg-white ${
                  isOwner ? "ring-2 ring-[#7A1F1F]/20 bg-[#F5ECEC]/30" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F5ECEC] flex items-center justify-center text-sm font-semibold text-[#7A1F1F] shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-[#111827]">{user.name}</p>
                        {isCurrentUser && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#7A1F1F] text-white">
                            YOU
                          </span>
                        )}
                      </div>
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: roleConfig.color, backgroundColor: roleConfig.bgColor }}
                      >
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2 text-xs mb-3">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <PhoneIcon className="h-3 w-3" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle
                      className={`h-2 w-2 fill-current ${
                        user.isActive ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                    <span className={`text-xs ${user.isActive ? "text-green-600" : "text-gray-500"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  {canDeleteUser(user) && (
                    <button
                      onClick={() => openDeleteModal(user)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add User Modal */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => {
            setAddModalOpen(false)
            setUserForm({})
          }}
          title="Add New User"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Name *</label>
              <input
                type="text"
                value={userForm.name || ""}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Email *</label>
              <input
                type="email"
                value={userForm.email || ""}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Phone</label>
              <input
                type="tel"
                value={userForm.phone || ""}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={userForm.password || ""}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F] pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={userForm.confirmPassword || ""}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Role *</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {AVAILABLE_ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Active</label>
              <button
                onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  userForm.isActive !== false
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {userForm.isActive !== false ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Create User
              </button>
              <button
                onClick={() => {
                  setAddModalOpen(false)
                  setUserForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingUser(null)
            setUserForm({})
            setResetPassword(false)
            setNewPassword("")
          }}
          title={`Edit User — ${editingUser.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Name *</label>
              <input
                type="text"
                value={userForm.name || ""}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-1">Email (readonly)</label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Phone</label>
              <input
                type="tel"
                value={userForm.phone || ""}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {editingUser.role === "OWNER" && (
                  <option value="OWNER">Owner</option>
                )}
                {AVAILABLE_ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Active</label>
              <button
                onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  userForm.isActive
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {userForm.isActive ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetPassword}
                  onChange={(e) => {
                    setResetPassword(e.target.checked)
                    if (!e.target.checked) setNewPassword("")
                  }}
                  className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                />
                <span className="text-sm font-medium text-[#111827]">Reset Password</span>
              </label>

              {resetPassword && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-[#111827] mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F] pr-10"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleEditUser}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setEditingUser(null)
                  setUserForm({})
                  setResetPassword(false)
                  setNewPassword("")
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && userToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setUserToDelete(null)
          }}
          title={`Hapus User "${userToDelete.name}"?`}
          description={
            userToDelete.role === "OWNER"
              ? "Owner tidak bisa dihapus."
              : userToDelete.id === currentUser?.id
              ? "Anda tidak bisa menghapus akun sendiri."
              : "User akan dihapus permanent. Booking history yang di-handle user ini akan tetap ada."
          }
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  )
}
