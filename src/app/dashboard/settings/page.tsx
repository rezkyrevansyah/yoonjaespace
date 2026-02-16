"use client"

import { useState } from "react"
import {
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  Camera,
  Palette,
  Puzzle,
  Ticket,
  ListChecks,
  Info,
  Check,
  X
} from "lucide-react"
import {
  mockPackages as initialPackages,
  mockBackgrounds as initialBackgrounds,
  mockAddOns as initialAddOns,
  mockVouchers as initialVouchers
} from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import type { Package, Background, AddOn, Voucher } from "@/lib/types"

type SettingsTab = "general" | "packages" | "backgrounds" | "addons" | "vouchers" | "customfields"

interface StudioInfo {
  name: string
  address: string
  phone: string
  instagram: string
  openTime: string
  closeTime: string
  dayOff: string
  defaultPaymentStatus: "PAID" | "UNPAID"
}

interface CustomField {
  id: string
  name: string
  type: "TEXT" | "SELECT" | "CHECKBOX" | "NUMBER"
  options?: string
  required: boolean
  sortOrder: number
  isActive: boolean
}

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "general", label: "General", icon: Info },
  { key: "packages", label: "Packages", icon: Camera },
  { key: "backgrounds", label: "Backgrounds", icon: Palette },
  { key: "addons", label: "Add-ons", icon: Puzzle },
  { key: "vouchers", label: "Vouchers", icon: Ticket },
  { key: "customfields", label: "Custom Fields", icon: ListChecks }
]

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "SELECT", label: "Select" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "NUMBER", label: "Number" }
]

export default function SettingsPage() {
  const isMobile = useMobile()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  // Studio Info state
  const [studioInfo, setStudioInfo] = useState<StudioInfo>({
    name: "Yoonjaespace Studio",
    address: "Jl. Sudirman No. 123, Jakarta Pusat",
    phone: "08123456789",
    instagram: "@yoonjaespace",
    openTime: "09:00",
    closeTime: "17:00",
    dayOff: "Selasa",
    defaultPaymentStatus: "UNPAID"
  })

  // Packages state
  const [packages, setPackages] = useState<Package[]>(initialPackages)
  const [packageModalOpen, setPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [deletePackageModal, setDeletePackageModal] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null)

  // Backgrounds state
  const [backgrounds, setBackgrounds] = useState<Background[]>(initialBackgrounds)
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)
  const [editingBackground, setEditingBackground] = useState<Background | null>(null)
  const [deleteBackgroundModal, setDeleteBackgroundModal] = useState(false)
  const [backgroundToDelete, setBackgroundToDelete] = useState<Background | null>(null)

  // Add-ons state
  const [addons, setAddons] = useState<AddOn[]>(initialAddOns)
  const [addonModalOpen, setAddonModalOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null)
  const [deleteAddonModal, setDeleteAddonModal] = useState(false)
  const [addonToDelete, setAddonToDelete] = useState<AddOn | null>(null)

  // Vouchers state
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers)
  const [voucherModalOpen, setVoucherModalOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deleteVoucherModal, setDeleteVoucherModal] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null)

  // Custom Fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([
    {
      id: "cf-001",
      name: "Tema Warna",
      type: "SELECT",
      options: "Pastel Pink, Pastel Blue, Rustic, Classic White",
      required: false,
      sortOrder: 1,
      isActive: true
    },
    {
      id: "cf-002",
      name: "Request Pose",
      type: "TEXT",
      required: false,
      sortOrder: 2,
      isActive: true
    },
    {
      id: "cf-003",
      name: "Bawa Props Sendiri",
      type: "CHECKBOX",
      required: false,
      sortOrder: 3,
      isActive: true
    }
  ])
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [editingCustomField, setEditingCustomField] = useState<CustomField | null>(null)
  const [deleteCustomFieldModal, setDeleteCustomFieldModal] = useState(false)
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomField | null>(null)

  // Form states
  const [packageForm, setPackageForm] = useState<Partial<Package>>({})
  const [backgroundForm, setBackgroundForm] = useState<Partial<Background>>({})
  const [addonForm, setAddonForm] = useState<Partial<AddOn>>({})
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({})
  const [customFieldForm, setCustomFieldForm] = useState<Partial<CustomField>>({})

  // Save Studio Info
  const handleSaveStudioInfo = () => {
    showToast("Studio information berhasil disimpan", "success")
  }

  // Package CRUD
  const handleSavePackage = () => {
    if (!packageForm.name || !packageForm.price || !packageForm.duration || !packageForm.editedPhotos) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (editingPackage) {
      setPackages(packages.map(p => p.id === editingPackage.id ? { ...editingPackage, ...packageForm } as Package : p))
      showToast(`Package "${packageForm.name}" berhasil diupdate`, "success")
    } else {
      const newPackage: Package = {
        id: `pkg-${Date.now()}`,
        name: packageForm.name!,
        description: packageForm.description || "",
        duration: packageForm.duration!,
        price: packageForm.price!,
        editedPhotos: packageForm.editedPhotos!,
        allPhotos: packageForm.allPhotos || false,
        isActive: packageForm.isActive !== undefined ? packageForm.isActive : true
      }
      setPackages([...packages, newPackage])
      showToast(`Package "${packageForm.name}" berhasil ditambahkan`, "success")
    }

    setPackageModalOpen(false)
    setEditingPackage(null)
    setPackageForm({})
  }

  const handleDeletePackage = () => {
    if (!packageToDelete) return
    setPackages(packages.filter(p => p.id !== packageToDelete.id))
    showToast(`Package "${packageToDelete.name}" berhasil dihapus`, "success")
    setDeletePackageModal(false)
    setPackageToDelete(null)
  }

  // Background CRUD
  const handleSaveBackground = () => {
    if (!backgroundForm.name) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (editingBackground) {
      setBackgrounds(backgrounds.map(b => b.id === editingBackground.id ? { ...editingBackground, ...backgroundForm } as Background : b))
      showToast(`Background "${backgroundForm.name}" berhasil diupdate`, "success")
    } else {
      const newBackground: Background = {
        id: `bg-${Date.now()}`,
        name: backgroundForm.name!,
        description: backgroundForm.description || "",
        isAvailable: backgroundForm.isAvailable !== undefined ? backgroundForm.isAvailable : true
      }
      setBackgrounds([...backgrounds, newBackground])
      showToast(`Background "${backgroundForm.name}" berhasil ditambahkan`, "success")
    }

    setBackgroundModalOpen(false)
    setEditingBackground(null)
    setBackgroundForm({})
  }

  const handleDeleteBackground = () => {
    if (!backgroundToDelete) return
    setBackgrounds(backgrounds.filter(b => b.id !== backgroundToDelete.id))
    showToast(`Background "${backgroundToDelete.name}" berhasil dihapus`, "success")
    setDeleteBackgroundModal(false)
    setBackgroundToDelete(null)
  }

  // Add-on CRUD
  const handleSaveAddon = () => {
    if (!addonForm.name || !addonForm.price) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (editingAddon) {
      setAddons(addons.map(a => a.id === editingAddon.id ? { ...editingAddon, ...addonForm } as AddOn : a))
      showToast(`Add-on "${addonForm.name}" berhasil diupdate`, "success")
    } else {
      const newAddon: AddOn = {
        id: `addon-${Date.now()}`,
        name: addonForm.name!,
        price: addonForm.price!,
        description: addonForm.description || "",
        isActive: addonForm.isActive !== undefined ? addonForm.isActive : true
      }
      setAddons([...addons, newAddon])
      showToast(`Add-on "${addonForm.name}" berhasil ditambahkan`, "success")
    }

    setAddonModalOpen(false)
    setEditingAddon(null)
    setAddonForm({})
  }

  const handleDeleteAddon = () => {
    if (!addonToDelete) return
    setAddons(addons.filter(a => a.id !== addonToDelete.id))
    showToast(`Add-on "${addonToDelete.name}" berhasil dihapus`, "success")
    setDeleteAddonModal(false)
    setAddonToDelete(null)
  }

  // Voucher CRUD
  const handleSaveVoucher = () => {
    if (!voucherForm.code || !voucherForm.discountType || voucherForm.discountValue === undefined || !voucherForm.validFrom || !voucherForm.validUntil) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (new Date(voucherForm.validUntil) < new Date(voucherForm.validFrom)) {
      showToast("Valid Until harus lebih besar dari Valid From", "warning")
      return
    }

    if (editingVoucher) {
      setVouchers(vouchers.map(v => v.id === editingVoucher.id ? { ...editingVoucher, ...voucherForm } as Voucher : v))
      showToast(`Voucher "${voucherForm.code}" berhasil diupdate`, "success")
    } else {
      const newVoucher: Voucher = {
        id: `vch-${Date.now()}`,
        code: voucherForm.code!.toUpperCase(),
        discountType: voucherForm.discountType!,
        discountValue: voucherForm.discountValue!,
        minPurchase: voucherForm.minPurchase || 0,
        maxUses: voucherForm.maxUses || 100,
        usedCount: 0,
        validFrom: voucherForm.validFrom!,
        validUntil: voucherForm.validUntil!,
        isActive: voucherForm.isActive !== undefined ? voucherForm.isActive : true
      }
      setVouchers([...vouchers, newVoucher])
      showToast(`Voucher "${voucherForm.code}" berhasil ditambahkan`, "success")
    }

    setVoucherModalOpen(false)
    setEditingVoucher(null)
    setVoucherForm({})
  }

  const handleDeleteVoucher = () => {
    if (!voucherToDelete) return
    setVouchers(vouchers.filter(v => v.id !== voucherToDelete.id))
    showToast(`Voucher "${voucherToDelete.code}" berhasil dihapus`, "success")
    setDeleteVoucherModal(false)
    setVoucherToDelete(null)
  }

  // Custom Field CRUD
  const handleSaveCustomField = () => {
    if (!customFieldForm.name || !customFieldForm.type) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (customFieldForm.type === "SELECT" && !customFieldForm.options) {
      showToast("Options wajib diisi untuk field type Select", "warning")
      return
    }

    if (editingCustomField) {
      setCustomFields(customFields.map(cf => cf.id === editingCustomField.id ? { ...editingCustomField, ...customFieldForm } as CustomField : cf))
      showToast(`Custom field "${customFieldForm.name}" berhasil diupdate`, "success")
    } else {
      const maxSortOrder = customFields.length > 0 ? Math.max(...customFields.map(cf => cf.sortOrder)) : 0
      const newCustomField: CustomField = {
        id: `cf-${Date.now()}`,
        name: customFieldForm.name!,
        type: customFieldForm.type!,
        options: customFieldForm.options,
        required: customFieldForm.required || false,
        sortOrder: customFieldForm.sortOrder || maxSortOrder + 1,
        isActive: customFieldForm.isActive !== undefined ? customFieldForm.isActive : true
      }
      setCustomFields([...customFields, newCustomField])
      showToast(`Custom field "${customFieldForm.name}" berhasil ditambahkan`, "success")
    }

    setCustomFieldModalOpen(false)
    setEditingCustomField(null)
    setCustomFieldForm({})
  }

  const handleDeleteCustomField = () => {
    if (!customFieldToDelete) return
    setCustomFields(customFields.filter(cf => cf.id !== customFieldToDelete.id))
    showToast(`Custom field "${customFieldToDelete.name}" berhasil dihapus`, "success")
    setDeleteCustomFieldModal(false)
    setCustomFieldToDelete(null)
  }

  const movefieldUp = (index: number) => {
    if (index === 0) return
    const newFields = [...customFields]
    const temp = newFields[index - 1].sortOrder
    newFields[index - 1].sortOrder = newFields[index].sortOrder
    newFields[index].sortOrder = temp
    newFields.sort((a, b) => a.sortOrder - b.sortOrder)
    setCustomFields(newFields)
  }

  const moveFieldDown = (index: number) => {
    if (index === customFields.length - 1) return
    const newFields = [...customFields]
    const temp = newFields[index + 1].sortOrder
    newFields[index + 1].sortOrder = newFields[index].sortOrder
    newFields[index].sortOrder = temp
    newFields.sort((a, b) => a.sortOrder - b.sortOrder)
    setCustomFields(newFields)
  }

  const getFieldTypeBadgeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      TEXT: { bg: "bg-blue-50", text: "text-blue-700" },
      SELECT: { bg: "bg-purple-50", text: "text-purple-700" },
      CHECKBOX: { bg: "bg-green-50", text: "text-green-700" },
      NUMBER: { bg: "bg-amber-50", text: "text-amber-700" }
    }
    return colors[type] || colors.TEXT
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#F5ECEC] flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-[#7A1F1F]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Settings</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Kelola konfigurasi studio dan data master
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={isMobile ? "" : "flex gap-1 p-1 bg-[#F3F4F6] rounded-xl overflow-x-auto"}>
        {isMobile ? (
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
          >
            {TABS.map(tab => (
              <option key={tab.key} value={tab.key}>{tab.label}</option>
            ))}
          </select>
        ) : (
          TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === key
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))
        )}
      </div>

      {/* Tab Content */}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Studio Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Studio Name *</label>
              <input
                type="text"
                value={studioInfo.name}
                onChange={(e) => setStudioInfo({ ...studioInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Studio Phone *</label>
              <input
                type="tel"
                value={studioInfo.phone}
                onChange={(e) => setStudioInfo({ ...studioInfo, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#111827] mb-1">Studio Address *</label>
              <textarea
                value={studioInfo.address}
                onChange={(e) => setStudioInfo({ ...studioInfo, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Instagram</label>
              <input
                type="text"
                value={studioInfo.instagram}
                onChange={(e) => setStudioInfo({ ...studioInfo, instagram: e.target.value })}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Day Off</label>
              <select
                value={studioInfo.dayOff}
                onChange={(e) => setStudioInfo({ ...studioInfo, dayOff: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Open Time</label>
              <input
                type="time"
                value={studioInfo.openTime}
                onChange={(e) => setStudioInfo({ ...studioInfo, openTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Close Time</label>
              <input
                type="time"
                value={studioInfo.closeTime}
                onChange={(e) => setStudioInfo({ ...studioInfo, closeTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Default Payment Status</label>
              <button
                onClick={() => setStudioInfo({ ...studioInfo, defaultPaymentStatus: studioInfo.defaultPaymentStatus === "PAID" ? "UNPAID" : "PAID" })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  studioInfo.defaultPaymentStatus === "PAID"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {studioInfo.defaultPaymentStatus === "PAID" ? "Paid" : "Unpaid"}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <button
              onClick={handleSaveStudioInfo}
              className="px-6 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Packages Tab - Due to size limit, I'll create a simplified version showing the pattern */}
      {activeTab === "packages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Packages</h2>
            <button
              onClick={() => {
                setEditingPackage(null)
                setPackageForm({})
                setPackageModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Package
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Edited Photos</th>
                    <th className="text-left py-3 px-4 font-medium text-[#6B7280]">All Photos</th>
                    <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Active</th>
                    <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#111827]">{pkg.name}</p>
                        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{pkg.description}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111827]">{formatCurrency(pkg.price)}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{pkg.duration} menit</td>
                      <td className="py-3 px-4 text-[#6B7280]">{pkg.editedPhotos} foto</td>
                      <td className="py-3 px-4">
                        {pkg.allPhotos ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Ya</span>
                        ) : (
                          <span className="text-[#6B7280]">Tidak</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setPackages(packages.map(p => p.id === pkg.id ? { ...p, isActive: !p.isActive } : p))
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            pkg.isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {pkg.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {pkg.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPackage(pkg)
                              setPackageForm(pkg)
                              setPackageModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPackageToDelete(pkg)
                              setDeletePackageModal(true)
                            }}
                            className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {packageModalOpen && (
        <Modal
          isOpen={packageModalOpen}
          onClose={() => {
            setPackageModalOpen(false)
            setEditingPackage(null)
            setPackageForm({})
          }}
          title={editingPackage ? "Edit Package" : "Add New Package"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Name *</label>
              <input
                type="text"
                value={packageForm.name || ""}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
              <textarea
                value={packageForm.description || ""}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Price (Rp) *</label>
                <input
                  type="number"
                  value={packageForm.price || ""}
                  onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Duration (menit) *</label>
                <input
                  type="number"
                  value={packageForm.duration || ""}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Edited Photos *</label>
                <input
                  type="number"
                  value={packageForm.editedPhotos || ""}
                  onChange={(e) => setPackageForm({ ...packageForm, editedPhotos: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={packageForm.allPhotos || false}
                    onChange={(e) => setPackageForm({ ...packageForm, allPhotos: e.target.checked })}
                    className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                  />
                  <span className="text-sm text-[#111827]">All Photos</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Active</label>
              <button
                onClick={() => setPackageForm({ ...packageForm, isActive: !packageForm.isActive })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  packageForm.isActive !== false
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {packageForm.isActive !== false ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSavePackage}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setPackageModalOpen(false)
                  setEditingPackage(null)
                  setPackageForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Package Modal */}
      {deletePackageModal && packageToDelete && (
        <Modal
          isOpen={deletePackageModal}
          onClose={() => {
            setDeletePackageModal(false)
            setPackageToDelete(null)
          }}
          title="Delete Package"
          description={`Are you sure you want to delete package "${packageToDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeletePackage}
        />
      )}

      {/* Note: Due to character limit, I'm showing the pattern for one tab. */}
      {/* The other tabs (Backgrounds, Add-ons, Vouchers, Custom Fields) follow */}
      {/* the same pattern with their respective CRUD operations */}

      {/* Backgrounds Tab */}
      {activeTab === "backgrounds" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Backgrounds</h2>
            <button
              onClick={() => {
                setEditingBackground(null)
                setBackgroundForm({})
                setBackgroundModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Background
            </button>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {backgrounds.map((bg) => (
                <div key={bg.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111827]">{bg.name}</h3>
                      {bg.description && <p className="text-xs text-[#6B7280] mt-1">{bg.description}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      bg.isAvailable
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}>
                      {bg.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingBackground(bg)
                        setBackgroundForm(bg)
                        setBackgroundModalOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setBackgroundToDelete(bg)
                        setDeleteBackgroundModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Description</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backgrounds.map((bg) => (
                      <tr key={bg.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111827]">{bg.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{bg.description || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setBackgrounds(backgrounds.map(b => b.id === bg.id ? { ...b, isAvailable: !b.isAvailable } : b))
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              bg.isAvailable
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {bg.isAvailable ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {bg.isAvailable ? "Available" : "Unavailable"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBackground(bg)
                                setBackgroundForm(bg)
                                setBackgroundModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setBackgroundToDelete(bg)
                                setDeleteBackgroundModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background Modal */}
      {backgroundModalOpen && (
        <Modal
          isOpen={backgroundModalOpen}
          onClose={() => {
            setBackgroundModalOpen(false)
            setEditingBackground(null)
            setBackgroundForm({})
          }}
          title={editingBackground ? "Edit Background" : "Add New Background"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Name *</label>
              <input
                type="text"
                value={backgroundForm.name || ""}
                onChange={(e) => setBackgroundForm({ ...backgroundForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
              <textarea
                value={backgroundForm.description || ""}
                onChange={(e) => setBackgroundForm({ ...backgroundForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Status</label>
              <button
                onClick={() => setBackgroundForm({ ...backgroundForm, isAvailable: !backgroundForm.isAvailable })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  backgroundForm.isAvailable !== false
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {backgroundForm.isAvailable !== false ? "Available" : "Unavailable"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSaveBackground}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setBackgroundModalOpen(false)
                  setEditingBackground(null)
                  setBackgroundForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Background Modal */}
      {deleteBackgroundModal && backgroundToDelete && (
        <Modal
          isOpen={deleteBackgroundModal}
          onClose={() => {
            setDeleteBackgroundModal(false)
            setBackgroundToDelete(null)
          }}
          title="Delete Background"
          description={`Are you sure you want to delete background "${backgroundToDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteBackground}
        />
      )}

      {/* Add-ons Tab */}
      {activeTab === "addons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Add-ons</h2>
            <button
              onClick={() => {
                setEditingAddon(null)
                setAddonForm({})
                setAddonModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Add-on
            </button>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {addons.map((addon) => (
                <div key={addon.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111827]">{addon.name}</h3>
                      <p className="text-sm font-medium text-[#7A1F1F] mt-1">{formatCurrency(addon.price)}</p>
                      {addon.description && <p className="text-xs text-[#6B7280] mt-1">{addon.description}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      addon.isActive
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-50 text-gray-700 border border-gray-200"
                    }`}>
                      {addon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingAddon(addon)
                        setAddonForm(addon)
                        setAddonModalOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setAddonToDelete(addon)
                        setDeleteAddonModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Price</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addons.map((addon) => (
                      <tr key={addon.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111827]">{addon.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{addon.description || "-"}</td>
                        <td className="py-3 px-4 font-medium text-[#111827]">{formatCurrency(addon.price)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setAddons(addons.map(a => a.id === addon.id ? { ...a, isActive: !a.isActive } : a))
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              addon.isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {addon.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {addon.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingAddon(addon)
                                setAddonForm(addon)
                                setAddonModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAddonToDelete(addon)
                                setDeleteAddonModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add-on Modal */}
      {addonModalOpen && (
        <Modal
          isOpen={addonModalOpen}
          onClose={() => {
            setAddonModalOpen(false)
            setEditingAddon(null)
            setAddonForm({})
          }}
          title={editingAddon ? "Edit Add-on" : "Add New Add-on"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Name *</label>
              <input
                type="text"
                value={addonForm.name || ""}
                onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
              <textarea
                value={addonForm.description || ""}
                onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Price (Rp) *</label>
              <input
                type="number"
                value={addonForm.price || ""}
                onChange={(e) => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Status</label>
              <button
                onClick={() => setAddonForm({ ...addonForm, isActive: !addonForm.isActive })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addonForm.isActive !== false
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {addonForm.isActive !== false ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSaveAddon}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setAddonModalOpen(false)
                  setEditingAddon(null)
                  setAddonForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Add-on Modal */}
      {deleteAddonModal && addonToDelete && (
        <Modal
          isOpen={deleteAddonModal}
          onClose={() => {
            setDeleteAddonModal(false)
            setAddonToDelete(null)
          }}
          title="Delete Add-on"
          description={`Are you sure you want to delete add-on "${addonToDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteAddon}
        />
      )}

      {/* Vouchers Tab */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Vouchers</h2>
            <button
              onClick={() => {
                setEditingVoucher(null)
                setVoucherForm({})
                setVoucherModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Voucher
            </button>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[#7A1F1F] bg-[#F5ECEC] px-2 py-0.5 rounded">{voucher.code}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          voucher.isActive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {voucher.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B7280]">
                        {voucher.discountType === "PERCENTAGE"
                          ? `${voucher.discountValue}% Off`
                          : `${formatCurrency(voucher.discountValue)} Off`}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Valid: {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Usage: {voucher.usedCount}/{voucher.maxUses}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingVoucher(voucher)
                        setVoucherForm(voucher)
                        setVoucherModalOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setVoucherToDelete(voucher)
                        setDeleteVoucherModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Discount</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Min Purchase</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Valid Period</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Usage</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#7A1F1F] bg-[#F5ECEC] px-2 py-0.5 rounded">{voucher.code}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#111827]">
                          {voucher.discountType === "PERCENTAGE"
                            ? `${voucher.discountValue}%`
                            : formatCurrency(voucher.discountValue)}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">{formatCurrency(voucher.minPurchase)}</td>
                        <td className="py-3 px-4 text-[#6B7280] text-xs">
                          {formatDate(voucher.validFrom)}<br/>
                          - {formatDate(voucher.validUntil)}
                        </td>
                        <td className="py-3 px-4 text-center text-[#6B7280]">
                          {voucher.usedCount}/{voucher.maxUses}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setVouchers(vouchers.map(v => v.id === voucher.id ? { ...v, isActive: !v.isActive } : v))
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              voucher.isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {voucher.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {voucher.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingVoucher(voucher)
                                setVoucherForm(voucher)
                                setVoucherModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setVoucherToDelete(voucher)
                                setDeleteVoucherModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voucher Modal */}
      {voucherModalOpen && (
        <Modal
          isOpen={voucherModalOpen}
          onClose={() => {
            setVoucherModalOpen(false)
            setEditingVoucher(null)
            setVoucherForm({})
          }}
          title={editingVoucher ? "Edit Voucher" : "Add New Voucher"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Code *</label>
              <input
                type="text"
                value={voucherForm.code || ""}
                onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                placeholder="PROMO2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Discount Type *</label>
                <select
                  value={voucherForm.discountType || "PERCENTAGE"}
                  onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Discount Value * {voucherForm.discountType === "PERCENTAGE" ? "(%)" : "(Rp)"}
                </label>
                <input
                  type="number"
                  value={voucherForm.discountValue || ""}
                  onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: parseFloat(e.target.value) })}
                  min="0"
                  max={voucherForm.discountType === "PERCENTAGE" ? "100" : undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Min Purchase (Rp)</label>
                <input
                  type="number"
                  value={voucherForm.minPurchase || 0}
                  onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: parseFloat(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Max Uses</label>
                <input
                  type="number"
                  value={voucherForm.maxUses || 100}
                  onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Valid From *</label>
                <input
                  type="date"
                  value={voucherForm.validFrom || ""}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Valid Until *</label>
                <input
                  type="date"
                  value={voucherForm.validUntil || ""}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Status</label>
              <button
                onClick={() => setVoucherForm({ ...voucherForm, isActive: !voucherForm.isActive })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  voucherForm.isActive !== false
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {voucherForm.isActive !== false ? "Active" : "Inactive"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSaveVoucher}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setVoucherModalOpen(false)
                  setEditingVoucher(null)
                  setVoucherForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Voucher Modal */}
      {deleteVoucherModal && voucherToDelete && (
        <Modal
          isOpen={deleteVoucherModal}
          onClose={() => {
            setDeleteVoucherModal(false)
            setVoucherToDelete(null)
          }}
          title="Delete Voucher"
          description={`Are you sure you want to delete voucher "${voucherToDelete.code}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteVoucher}
        />
      )}

      {/* Custom Fields Tab */}
      {activeTab === "customfields" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Custom Fields</h2>
            <button
              onClick={() => {
                setEditingCustomField(null)
                setCustomFieldForm({})
                setCustomFieldModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Custom Field
            </button>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              {customFields.sort((a, b) => a.sortOrder - b.sortOrder).map((field, index) => (
                <div key={field.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#111827]">{field.name}</h3>
                        {field.required && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Required</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFieldTypeBadgeColor(field.type).bg} ${getFieldTypeBadgeColor(field.type).text}`}>
                          {field.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          field.isActive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {field.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {field.options && (
                        <p className="text-xs text-[#6B7280] mt-1">Options: {field.options}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => movefieldUp(index)}
                      disabled={index === 0}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveFieldDown(index)}
                      disabled={index === customFields.length - 1}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomField(field)
                        setCustomFieldForm(field)
                        setCustomFieldModalOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setCustomFieldToDelete(field)
                        setDeleteCustomFieldModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280] w-16">Order</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Options</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Required</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-[#6B7280]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customFields.sort((a, b) => a.sortOrder - b.sortOrder).map((field, index) => (
                      <tr key={field.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => movefieldUp(index)}
                              disabled={index === 0}
                              className="p-0.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▲
                            </button>
                            <span className="text-xs text-[#6B7280]">{field.sortOrder}</span>
                            <button
                              onClick={() => moveFieldDown(index)}
                              disabled={index === customFields.length - 1}
                              className="p-0.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#111827]">{field.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFieldTypeBadgeColor(field.type).bg} ${getFieldTypeBadgeColor(field.type).text}`}>
                            {field.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] text-xs max-w-xs truncate">
                          {field.options || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {field.required ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Yes</span>
                          ) : (
                            <span className="text-[#6B7280]">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setCustomFields(customFields.map(cf => cf.id === field.id ? { ...cf, isActive: !cf.isActive } : cf))
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              field.isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {field.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {field.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCustomField(field)
                                setCustomFieldForm(field)
                                setCustomFieldModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setCustomFieldToDelete(field)
                                setDeleteCustomFieldModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Field Modal */}
      {customFieldModalOpen && (
        <Modal
          isOpen={customFieldModalOpen}
          onClose={() => {
            setCustomFieldModalOpen(false)
            setEditingCustomField(null)
            setCustomFieldForm({})
          }}
          title={editingCustomField ? "Edit Custom Field" : "Add New Custom Field"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Field Name *</label>
              <input
                type="text"
                value={customFieldForm.name || ""}
                onChange={(e) => setCustomFieldForm({ ...customFieldForm, name: e.target.value })}
                placeholder="e.g., Tema Warna"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Field Type *</label>
              <select
                value={customFieldForm.type || "TEXT"}
                onChange={(e) => setCustomFieldForm({ ...customFieldForm, type: e.target.value as CustomField["type"] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              >
                {FIELD_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>

            {customFieldForm.type === "SELECT" && (
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">
                  Options * <span className="text-xs text-[#6B7280]">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={customFieldForm.options || ""}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                />
              </div>
            )}

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customFieldForm.required || false}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, required: e.target.checked })}
                  className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                />
                <span className="text-sm text-[#111827]">Required Field</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customFieldForm.isActive !== false}
                  onChange={(e) => setCustomFieldForm({ ...customFieldForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                />
                <span className="text-sm text-[#111827]">Active</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSaveCustomField}
                className="flex-1 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCustomFieldModalOpen(false)
                  setEditingCustomField(null)
                  setCustomFieldForm({})
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Custom Field Modal */}
      {deleteCustomFieldModal && customFieldToDelete && (
        <Modal
          isOpen={deleteCustomFieldModal}
          onClose={() => {
            setDeleteCustomFieldModal(false)
            setCustomFieldToDelete(null)
          }}
          title="Delete Custom Field"
          description={`Are you sure you want to delete custom field "${customFieldToDelete.name}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteCustomField}
        />
      )}
    </div>
  )
}
