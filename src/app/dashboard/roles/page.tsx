"use client"

import { useState } from "react"
import { Shield, Plus, Edit2, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { useRoles, useMenus, type Role, type MenuPermission } from "@/lib/hooks/use-roles"
import { Modal } from "@/components/shared/modal"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"

interface RoleFormData {
  name: string
  description: string
  menuPermissions: { [menuId: string]: { canView: boolean; canEdit: boolean; canDelete: boolean } }
}

export default function RolesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { roles, isLoading: rolesLoading, isSubmitting, createRole, updateRole, deleteRole } = useRoles()
  const { menus } = useMenus()

  // Debug logging
  console.log('[RolesPage] Roles:', roles.length, '| Menus:', menus.length)

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Form state
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    menuPermissions: {}
  })

  // Redirect if not OWNER
  if (user && user.role !== 'OWNER') {
    router.push('/dashboard')
    return null
  }

  // Open modals
  const handleAdd = () => {
    setFormData({
      name: "",
      description: "",
      menuPermissions: menus.reduce((acc, menu) => ({
        ...acc,
        [menu.id]: { canView: false, canEdit: false, canDelete: false }
      }), {})
    })
    setAddModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)

    // Convert role permissions to form format
    const permissions = menus.reduce((acc, menu) => {
      const rolePerm = role.permissions.find(p => p.menuId === menu.id)
      return {
        ...acc,
        [menu.id]: rolePerm ? {
          canView: rolePerm.canView,
          canEdit: rolePerm.canEdit,
          canDelete: rolePerm.canDelete
        } : { canView: false, canEdit: false, canDelete: false }
      }
    }, {})

    setFormData({
      name: role.name,
      description: role.description || "",
      menuPermissions: permissions
    })
    setEditModalOpen(true)
  }

  const handleDelete = (role: Role) => {
    setSelectedRole(role)
    setDeleteModalOpen(true)
  }

  // Submit handlers
  const handleSubmitAdd = async () => {
    if (!formData.name.trim()) {
      return
    }

    const menuPermissions: MenuPermission[] = Object.entries(formData.menuPermissions)
      .filter(([_, perm]) => perm.canView) // Only include menus with canView = true
      .map(([menuId, perm]) => ({
        menuId,
        canView: perm.canView,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete
      }))

    const result = await createRole(formData.name, formData.description, menuPermissions)
    if (result.success) {
      setAddModalOpen(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedRole || !formData.name.trim()) {
      return
    }

    const menuPermissions: MenuPermission[] = Object.entries(formData.menuPermissions)
      .filter(([_, perm]) => perm.canView)
      .map(([menuId, perm]) => ({
        menuId,
        canView: perm.canView,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete
      }))

    const result = await updateRole(selectedRole.id, formData.name, formData.description, menuPermissions)
    if (result.success) {
      setEditModalOpen(false)
      setSelectedRole(null)
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedRole) return

    const result = await deleteRole(selectedRole.id)
    if (result.success) {
      setDeleteModalOpen(false)
      setSelectedRole(null)
    }
  }

  // Toggle permission
  const togglePermission = (menuId: string, type: 'canView' | 'canEdit' | 'canDelete') => {
    setFormData(prev => ({
      ...prev,
      menuPermissions: {
        ...prev.menuPermissions,
        [menuId]: {
          ...prev.menuPermissions[menuId],
          [type]: !prev.menuPermissions[menuId]?.[type],
          // Auto-enable canView if canEdit or canDelete is enabled
          ...(type !== 'canView' && !prev.menuPermissions[menuId]?.[type] ? { canView: true } : {})
        }
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Role Management</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Kelola custom roles dan hak akses menu
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={!menus || menus.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white text-sm font-semibold hover:bg-[#9B3333] transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      {/* Roles List */}
      {rolesLoading && roles.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-5 bg-gray-200 rounded w-16" />
                ))}
              </div>
              <div className="h-px bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#7A1F1F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111827]">{role.name}</h3>
                    {role.isSystem && (
                      <span className="text-xs text-[#9CA3AF]">System Role</span>
                    )}
                  </div>
                </div>
                {/* Only Owner role is truly locked, others can be edited/deleted */}
                {role.name !== 'Owner' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#7A1F1F] transition-colors"
                      title={role.isSystem ? "Edit permissions only" : "Edit role"}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={role._count.users > 0}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:bg-red-50 hover:text-[#DC2626] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={role._count.users > 0 ? `Cannot delete: ${role._count.users} user(s) using this role` : "Delete role"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {role.description && (
                <p className="text-sm text-[#6B7280] mb-3">{role.description}</p>
              )}

              <div className="space-y-2">
                <div className="text-xs text-[#9CA3AF] font-medium">Menu Access:</div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span
                      key={perm.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F9FAFB] text-xs text-[#6B7280]"
                    >
                      {perm.menu.label}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#F5ECEC] text-xs text-[#7A1F1F] font-medium">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">
                  {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Role Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Role Baru"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Nama Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marketing Staff"
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi role..."
              rows={2}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-3">
              Hak Akses Menu
            </label>
            {!menus ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 text-sm text-red-600">
                Error: Menu tidak dapat dimuat. Pastikan database sudah di-migrate.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {menus.map((menu) => (
                <div key={menu.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[#111827]">{menu.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canView || false}
                        onChange={() => togglePermission(menu.id, 'canView')}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F]"
                      />
                      <span className="text-xs text-[#6B7280]">View</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canEdit || false}
                        onChange={() => togglePermission(menu.id, 'canEdit')}
                        disabled={!formData.menuPermissions[menu.id]?.canView}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F] disabled:opacity-30"
                      />
                      <span className="text-xs text-[#6B7280]">Edit</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canDelete || false}
                        onChange={() => togglePermission(menu.id, 'canDelete')}
                        disabled={!formData.menuPermissions[menu.id]?.canView}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F] disabled:opacity-30"
                      />
                      <span className="text-xs text-[#6B7280]">Delete</span>
                    </label>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setAddModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitAdd}
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal - Similar structure to Add Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={selectedRole?.isSystem ? `Edit ${selectedRole.name} Permissions` : "Edit Role"}
        size="lg"
      >
        <div className="space-y-4">
          {selectedRole?.isSystem && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
              System role: You can only edit permissions, name and description cannot be changed.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Nama Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={selectedRole?.isSystem}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={selectedRole?.isSystem}
              rows={2}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-3">
              Hak Akses Menu
            </label>
            {!menus ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 text-sm text-red-600">
                Error: Menu tidak dapat dimuat. Pastikan database sudah di-migrate.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {menus.map((menu) => (
                <div key={menu.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[#111827]">{menu.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canView || false}
                        onChange={() => togglePermission(menu.id, 'canView')}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F]"
                      />
                      <span className="text-xs text-[#6B7280]">View</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canEdit || false}
                        onChange={() => togglePermission(menu.id, 'canEdit')}
                        disabled={!formData.menuPermissions[menu.id]?.canView}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F] disabled:opacity-30"
                      />
                      <span className="text-xs text-[#6B7280]">Edit</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.menuPermissions[menu.id]?.canDelete || false}
                        onChange={() => togglePermission(menu.id, 'canDelete')}
                        disabled={!formData.menuPermissions[menu.id]?.canView}
                        className="w-4 h-4 rounded border-gray-300 text-[#7A1F1F] focus:ring-[#7A1F1F] disabled:opacity-30"
                      />
                      <span className="text-xs text-[#6B7280]">Delete</span>
                    </label>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitEdit}
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#7A1F1F] text-white font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Role"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">
                Apakah Anda yakin ingin menghapus role &quot;{selectedRole?.name}&quot;?
              </p>
              <p className="text-xs text-red-600 mt-1">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitDelete}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
