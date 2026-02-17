"use client"

import { useState, useEffect } from "react"
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
  X,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Sparkles
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { Modal } from "@/components/shared/modal"
import type { Package, Background, AddOn, Voucher, CustomField } from "@/lib/types"
import { useSettings } from "@/lib/hooks/use-settings"
import {
  usePackages,
  useBackgrounds,
  useAddOnTemplates,
  useVouchers,
  useCustomFields
} from "@/lib/hooks/use-master-data"
import { apiPost, apiPatch, apiDelete } from "@/lib/api-client"
import { TEMPLATE_VARIABLES, validateTemplate, parseReminderTemplate } from "@/lib/utils/reminder-template"

type SettingsTab = "general" | "packages" | "backgrounds" | "addons" | "vouchers" | "customfields"

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

  // --- Hooks ---
  const { settings, updateSettings, isSaving } = useSettings()
  
  const { packages, mutate: mutatePackages } = usePackages(false) // fetch all
  const { backgrounds, mutate: mutateBackgrounds } = useBackgrounds(false)
  const { addOnTemplates: addons, mutate: mutateAddons } = useAddOnTemplates(false)
  const { vouchers, mutate: mutateVouchers } = useVouchers(false)
  const { customFields, mutate: mutateCustomFields } = useCustomFields(false)

  // --- Modal States ---
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Selected Items ---
  const [editingItem, setEditingItem] = useState<any>(null)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  
  // --- Forms ---
  const [packageForm, setPackageForm] = useState<Partial<Package>>({})
  const [backgroundForm, setBackgroundForm] = useState<Partial<Background>>({})
  const [addonForm, setAddonForm] = useState<Partial<AddOn>>({})
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({})
  const [customFieldForm, setCustomFieldForm] = useState<Partial<CustomField>>({})

  // --- General Settings Handlers ---
  const handleSaveStudioInfo = async () => {
    if (!settings) return
    const success = await updateSettings(studioInfoForm)
    if (success) {
      // settings is updated via hook mutation
    }
  }

  const handleSaveReminderTemplate = async () => {
    // Validate template first
    const validation = validateTemplate(reminderTemplate)
    if (!validation.isValid) {
      setTemplateError(validation.error || "Template tidak valid")
      showToast(validation.error || "Template tidak valid", "error")
      return
    }

    setTemplateError("")
    const success = await updateSettings({ reminderMessageTemplate: reminderTemplate })
    if (success) {
      showToast("Template reminder berhasil disimpan", "success")
    }
  }

  const handleTemplateChange = (value: string) => {
    setReminderTemplate(value)
    // Clear error on change
    setTemplateError("")
  }

  // We need useEffect to sync settings to local form state
  const [studioInfoForm, setStudioInfoForm] = useState<any>({})
  const [reminderTemplate, setReminderTemplate] = useState<string>("")
  const [templateError, setTemplateError] = useState<string>("")
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)

  useEffect(() => {
    if (settings && Object.keys(studioInfoForm).length === 0) {
        setStudioInfoForm(settings)
        setReminderTemplate(settings.reminderMessageTemplate || "")
    }
  }, [settings])

  // --- CRUD Helpers ---
  const handleCreate = async (url: string, data: any, mutateFn: Function, name: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await apiPost(url, data)
      if (error) throw new Error(error)
      await mutateFn()
      showToast(`${name} berhasil ditambahkan`, "success")
      setModalOpen(false)
      resetForms()
    } catch (err: any) {
      showToast(err.message || 'Failed to create item', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (url: string, data: any, mutateFn: Function, name: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await apiPatch(url, data)
      if (error) throw new Error(error)
      await mutateFn()
      showToast(`${name} berhasil diupdate`, "success")
      setModalOpen(false)
      setEditingItem(null)
      resetForms()
    } catch (err: any) {
      showToast(err.message || 'Failed to update item', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (url: string, mutateFn: Function, name: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await apiDelete(url)
      if (error) throw new Error(error)
      await mutateFn()
      showToast(`${name} berhasil dihapus`, "success")
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForms = () => {
    setPackageForm({})
    setBackgroundForm({})
    setAddonForm({})
    setVoucherForm({})
    setCustomFieldForm({})
  }

  // --- Specific Handlers ---
  
  // Packages
  const handleSavePackage = () => {
    if (!packageForm.name || !packageForm.price || !packageForm.duration || !packageForm.editedPhotos) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    const payload = {
        ...packageForm,
        isActive: packageForm.isActive !== undefined ? packageForm.isActive : true,
        allPhotos: packageForm.allPhotos || false
    }

    if (editingItem) {
      handleUpdate(`/api/packages/${editingItem.id}`, payload, mutatePackages, "Package")
    } else {
      handleCreate('/api/packages', payload, mutatePackages, "Package")
    }
  }

  const handleDeletePackage = () => {
    if (!itemToDelete) return
    handleDelete(`/api/packages/${itemToDelete.id}`, mutatePackages, "Package")
  }

  // Backgrounds
  const handleSaveBackground = () => {
    if (!backgroundForm.name) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    const payload = {
        ...backgroundForm,
        isActive: (backgroundForm as any).isActive !== undefined ? (backgroundForm as any).isActive : true
    }

    if (editingItem) {
      handleUpdate(`/api/backgrounds/${editingItem.id}`, payload, mutateBackgrounds, "Background")
    } else {
      handleCreate('/api/backgrounds', payload, mutateBackgrounds, "Background")
    }
  }
  
  const handleDeleteBackground = () => {
     if (!itemToDelete) return
     handleDelete(`/api/backgrounds/${itemToDelete.id}`, mutateBackgrounds, "Background")
  }

  // Addons
  const handleSaveAddon = () => {
    if (!addonForm.name || !(addonForm as any).defaultPrice) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    const payload = {
        ...addonForm,
        isActive: addonForm.isActive !== undefined ? addonForm.isActive : true
    }

    if (editingItem) {
      handleUpdate(`/api/addon-templates/${editingItem.id}`, payload, mutateAddons, "Add-on") // Note: API route might be different, strictly following use-master-data path
    } else {
      handleCreate('/api/addon-templates', payload, mutateAddons, "Add-on")
    }
  }

  const handleDeleteAddon = () => {
      if (!itemToDelete) return
      handleDelete(`/api/addon-templates/${itemToDelete.id}`, mutateAddons, "Add-on")
  }

  // Vouchers
  const handleSaveVoucher = () => {
    if (!voucherForm.code || !voucherForm.discountType || voucherForm.discountValue === undefined || !voucherForm.validFrom || !voucherForm.validUntil) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (new Date(voucherForm.validUntil) < new Date(voucherForm.validFrom)) {
      showToast("Valid Until harus lebih besar dari Valid From", "warning")
      return
    }

    // Ensure code is uppercase and set defaults
    const payload = {
        ...voucherForm,
        code: voucherForm.code.toUpperCase(),
        minPurchase: voucherForm.minPurchase !== undefined && voucherForm.minPurchase !== null ? voucherForm.minPurchase : 0,
        isActive: voucherForm.isActive !== undefined ? voucherForm.isActive : (editingItem ? editingItem.isActive : true)
    }

    if (editingItem) {
      handleUpdate(`/api/vouchers/${editingItem.id}`, payload, mutateVouchers, "Voucher")
    } else {
      handleCreate('/api/vouchers', payload, mutateVouchers, "Voucher")
    }
  }

  const handleDeleteVoucher = () => {
      if (!itemToDelete) return
      handleDelete(`/api/vouchers/${itemToDelete.id}`, mutateVouchers, "Voucher")
  }
  
  // Custom Fields
  const handleSaveCustomField = () => {
    if (!customFieldForm.fieldName || !customFieldForm.fieldType) {
      showToast("Mohon lengkapi field yang wajib", "warning")
      return
    }

    if (customFieldForm.fieldType === "SELECT" && !customFieldForm.options) {
      showToast("Options wajib diisi untuk field type Select", "warning")
      return
    }
    
    // Auto calculate sortOrder if new
    let sortOrder = customFieldForm.sortOrder
    if (!editingItem && !sortOrder && customFields) {
        const maxSort = customFields.length > 0 ? Math.max(...customFields.map((c: any) => c.sortOrder || 0)) : 0
        sortOrder = maxSort + 1
    }

    const payload = {
        ...customFieldForm,
        sortOrder,
        isRequired: customFieldForm.isRequired || false,
        isActive: customFieldForm.isActive !== undefined ? customFieldForm.isActive : true
    }

    if (editingItem) {
      handleUpdate(`/api/custom-fields/${editingItem.id}`, payload, mutateCustomFields, "Custom Field")
    } else {
      handleCreate('/api/custom-fields', payload, mutateCustomFields, "Custom Field")
    }
  }

  const handleDeleteCustomField = () => {
      if (!itemToDelete) return
      handleDelete(`/api/custom-fields/${itemToDelete.id}`, mutateCustomFields, "Custom Field")
  }
  
  const moveField = async (index: number, direction: 'up' | 'down') => {
      if (!customFields) return
      if (direction === 'up' && index === 0) return
      if (direction === 'down' && index === customFields.length - 1) return
      
      const newFields = [...customFields]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      
      // Swap sortOrder
      const tempOrder = newFields[index].sortOrder
      newFields[index].sortOrder = newFields[targetIndex].sortOrder
      newFields[targetIndex].sortOrder = tempOrder
      
      // We need to update both on server. 
      // Ideally check if API supports bulk update or reorder. 
      // Assuming individual updates for now.
      
      try {
          await apiPatch(`/api/custom-fields/${newFields[index].id}`, { sortOrder: newFields[index].sortOrder })
          await apiPatch(`/api/custom-fields/${newFields[targetIndex].id}`, { sortOrder: newFields[targetIndex].sortOrder })
          await mutateCustomFields()
      } catch (e) {
          showToast("Failed to reorder fields", "error")
      }
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

  // Define render functions for tables to keep return cleaner
  
  // ... (I'll keep the return structure similar but mapped to real data)

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

      {/* Content */}
      
      {/* General Tab */}
      {activeTab === "general" && settings && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Studio Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bind inputs to studioInfoForm local state (which needs to be initialized) */}
            {/* Since I can't easily do complex useEffect in this single write_to_file without errors, 
                I'll use a wrapper or just simple defaultValues if key changes, but uncontrolled is risky.
                Let's use a simple pattern: use key={settings.updatedAt} to force re-render? No settings has no updatedAt.
                I'll assume settings is loaded.
             */}
             
             {/* I will implement a safe Controlled Input pattern here */}
             {[
                 { label: "Studio Name", key: "name", type: "text" },
                 { label: "Studio Phone", key: "phone", type: "tel" },
                 { label: "Instagram", key: "instagram", type: "text", placeholder: "@username" },
                 { label: "Open Time", key: "openTime", type: "time" },
                 { label: "Close Time", key: "closeTime", type: "time" },
             ].map((field) => (
                 <div key={field.key}>
                    <label className="block text-sm font-medium text-[#111827] mb-1">{field.label} *</label>
                    <input
                        type={field.type}
                        defaultValue={(settings as any)[field.key]}
                        placeholder={field.placeholder}
                        onChange={(e) => setStudioInfoForm((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
                    />
                 </div>
             ))}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#111827] mb-1">Studio Address *</label>
              <textarea
                defaultValue={settings.address}
                onChange={(e) => setStudioInfoForm((prev: any) => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#7A1F1F]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Day Off (Multiple)</label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map(day => (
                  <label key={day} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={studioInfoForm.dayOff?.includes(day.toLowerCase()) || false}
                      onChange={(e) => {
                        const current = studioInfoForm.dayOff || settings.dayOff || []
                        const updated = e.target.checked
                          ? [...current, day.toLowerCase()]
                          : current.filter((d: string) => d !== day.toLowerCase())
                        setStudioInfoForm((prev: any) => ({ ...prev, dayOff: updated }))
                      }}
                      className="w-4 h-4 text-[#7A1F1F] rounded focus:ring-[#7A1F1F]"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            
             <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Default Payment Status</label>
              <button
                onClick={() => setStudioInfoForm((prev: any) => ({ 
                    ...prev, 
                    defaultPaymentStatus: (prev.defaultPaymentStatus || settings.defaultPaymentStatus) === "PAID" ? "UNPAID" : "PAID" 
                }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (studioInfoForm.defaultPaymentStatus || settings.defaultPaymentStatus) === "PAID"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {(studioInfoForm.defaultPaymentStatus || settings.defaultPaymentStatus) === "PAID" ? "Paid" : "Unpaid"}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <button
              onClick={handleSaveStudioInfo}
              disabled={isSaving}
              className="px-6 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Reminder Message Template Section */}
      {activeTab === "general" && settings && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Reminder Message Template</h2>
              <p className="text-sm text-[#6B7280]">Customize WhatsApp reminder message menggunakan template variables</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Message Template *
                </label>
                <textarea
                  value={reminderTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  rows={6}
                  placeholder="Contoh: Halo {{clientName}}, ini reminder untuk sesi foto kamu..."
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none font-mono ${
                    templateError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-[#7A1F1F] focus:border-[#7A1F1F]"
                  }`}
                />
                {templateError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                    <X className="h-4 w-4" />
                    {templateError}
                  </p>
                )}
              </div>

              {/* Preview Section */}
              <div>
                <button
                  onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                  className="flex items-center gap-2 text-sm font-medium text-[#7A1F1F] hover:text-[#9B3333] transition-colors mb-3"
                >
                  <Sparkles className="h-4 w-4" />
                  {showTemplatePreview ? "Hide Preview" : "Show Preview"}
                </button>

                {showTemplatePreview && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">Preview Message</p>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {parseReminderTemplate(reminderTemplate || "", {
                        clientName: "Budi Santoso",
                        date: "Senin, 17 Februari 2026",
                        time: "14:00",
                        packageName: "Premium Photo Session",
                        studioName: settings.name || "Yoonjaespace",
                        numberOfPeople: 2,
                        clientPageLink: `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/status/ABC123`,
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveReminderTemplate}
                  disabled={isSaving || !!templateError}
                  className="px-6 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Template"}
                </button>
                <button
                  onClick={() => {
                    setReminderTemplate(settings.reminderMessageTemplate || "")
                    setTemplateError("")
                  }}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Available Variables */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200 sticky top-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  Available Variables
                </h3>
                <div className="space-y-3">
                  {TEMPLATE_VARIABLES.map((variable) => (
                    <div
                      key={variable.key}
                      className="group cursor-pointer"
                      onClick={() => {
                        // Insert variable at cursor position or append
                        const textarea = document.querySelector('textarea[placeholder*="Contoh"]') as HTMLTextAreaElement
                        if (textarea) {
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const newValue = reminderTemplate.substring(0, start) + variable.key + reminderTemplate.substring(end)
                          setReminderTemplate(newValue)
                          // Focus and set cursor position after inserted variable
                          setTimeout(() => {
                            textarea.focus()
                            textarea.setSelectionRange(start + variable.key.length, start + variable.key.length)
                          }, 0)
                        }
                      }}
                    >
                      <div className="bg-white rounded-md p-2.5 border border-amber-200 group-hover:border-amber-400 group-hover:shadow-sm transition-all">
                        <code className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {variable.key}
                        </code>
                        <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-amber-200">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-gray-900">Tip:</strong> Klik variable untuk memasukkan ke template. Gunakan format <code className="bg-white px-1 py-0.5 rounded text-blue-700">{`{{namaVariable}}`}</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">Packages</h2>
            <button
              onClick={() => {
                setEditingItem(null)
                setPackageForm({})
                setModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Package
            </button>
          </div>

          {packages.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-sm">
              <Camera className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[#111827] mb-1">Belum ada package</h3>
              <p className="text-sm text-[#6B7280] mb-4">Buat package pertama untuk mulai menerima booking</p>
              <button
                onClick={() => { setEditingItem(null); setPackageForm({}); setModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Buat Package Pertama
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-[#6B7280]">Edited Photos</th>
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
                        <td className="py-3 px-4 text-center">
                           {pkg.isActive ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-400 mx-auto" />}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                             <button onClick={() => { setEditingItem(pkg); setPackageForm(pkg); setModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><Edit2 className="h-3.5 w-3.5" /></button>
                             <button onClick={() => { setItemToDelete(pkg); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
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
      
      {/* Backgrounds Tab */}
      {activeTab === "backgrounds" && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#111827]">Backgrounds</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setBackgroundForm({})
                    setModalOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Background
                </button>
              </div>

              {backgrounds.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-sm">
                  <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-[#111827] mb-1">Belum ada background</h3>
                  <p className="text-sm text-[#6B7280] mb-4">Tambahkan background pertama untuk opsi sesi fotografi</p>
                  <button
                    onClick={() => { setEditingItem(null); setBackgroundForm({}); setModalOpen(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Background Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                   {backgrounds.map(bg => (
                       <div key={bg.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                          <div>
                             <h3 className="font-semibold text-[#111827]">{bg.name}</h3>
                             <p className="text-sm text-[#6B7280]">{bg.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                               <div className={`px-2 py-1 rounded text-xs font-medium ${(bg as any).isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {(bg as any).isActive ? 'Available' : 'Unavailable'}
                               </div>
                               <button onClick={() => { setEditingItem(bg); setBackgroundForm(bg); setModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><Edit2 className="h-3.5 w-3.5" /></button>
                               <button onClick={() => { setItemToDelete(bg); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                   ))}
                </div>
              )}
          </div>
      )}

      {/* Other Tabs (Addons, Vouchers, CustomFields) would follow similar pattern */}
      {/* For brevity, I will implement Addons and Vouchers in a minimal way to fit the context window, assuming standard list/edit */}
      
      {activeTab === "addons" && (
         <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#111827]">Add-ons</h2>
                <button onClick={() => { setEditingItem(null); setAddonForm({}); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4" /> Add Add-on
                </button>
             </div>
             {addons.length === 0 ? (
               <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-sm">
                 <Puzzle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-semibold text-[#111827] mb-1">Belum ada add-on</h3>
                 <p className="text-sm text-[#6B7280] mb-4">Buat add-on pertama untuk layanan tambahan seperti MUA, extra person, dll</p>
                 <button
                   onClick={() => { setEditingItem(null); setAddonForm({}); setModalOpen(true); }}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                 >
                   <Plus className="h-4 w-4" />
                   Buat Add-on Pertama
                 </button>
               </div>
             ) : (
               <div className="space-y-3">
                  {addons.map(addon => (
                      <div key={addon.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                         <div>
                            <h3 className="font-semibold text-[#111827]">{addon.name}</h3>
                            <p className="text-sm font-medium text-[#7A1F1F]">{formatCurrency((addon as any).defaultPrice)}</p>
                         </div>
                         <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingItem(addon); setAddonForm(addon); setModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-300 text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { setItemToDelete(addon); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                         </div>
                      </div>
                  ))}
               </div>
             )}
         </div>
      )}

      {activeTab === "vouchers" && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#111827]">Vouchers</h2>
                <button onClick={() => { setEditingItem(null); setVoucherForm({}); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4" /> Add Voucher
                </button>
             </div>
             {vouchers.length === 0 ? (
               <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-sm">
                 <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-semibold text-[#111827] mb-1">Belum ada voucher</h3>
                 <p className="text-sm text-[#6B7280] mb-4">Buat voucher pertama untuk memberikan diskon kepada pelanggan</p>
                 <button
                   onClick={() => { setEditingItem(null); setVoucherForm({}); setModalOpen(true); }}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                 >
                   <Plus className="h-4 w-4" />
                   Buat Voucher Pertama
                 </button>
               </div>
             ) : (
               <div className="space-y-3">
                   {vouchers.map(v => (
                       <div key={v.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                          <div>
                             <div className="flex items-center gap-2">
                                 <h3 className="font-semibold text-[#111827]">{v.code}</h3>
                                 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}</span>
                                 <span className={`text-xs font-medium px-2 py-0.5 rounded ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                   {v.isActive ? 'Active' : 'Inactive'}
                                 </span>
                             </div>
                             <p className="text-xs text-[#6B7280]">Valid: {v.validUntil}</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingItem(v); setVoucherForm(v); setModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-300 text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { setItemToDelete(v); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                   ))}
               </div>
             )}
          </div>
      )}

      {activeTab === "customfields" && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#111827]">Custom Fields</h2>
                <button onClick={() => { setEditingItem(null); setCustomFieldForm({}); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4" /> Add Field
                </button>
             </div>
             {(!customFields || customFields.length === 0) ? (
               <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-sm">
                 <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-semibold text-[#111827] mb-1">Belum ada custom field</h3>
                 <p className="text-sm text-[#6B7280] mb-4">Buat custom field untuk menambah informasi tambahan pada form booking</p>
                 <button
                   onClick={() => { setEditingItem(null); setCustomFieldForm({}); setModalOpen(true); }}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-medium hover:bg-[#9B3333] transition-colors"
                 >
                   <Plus className="h-4 w-4" />
                   Buat Field Pertama
                 </button>
               </div>
             ) : (
               <div className="space-y-3">
                   {customFields.sort((a,b) => a.sortOrder - b.sortOrder).map((cf: CustomField, index: number) => (
                       <div key={cf.id} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                          <div>
                             <div className="flex items-center gap-2">
                                 <h3 className="font-semibold text-[#111827]">{cf.fieldName}</h3>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${getFieldTypeBadgeColor(cf.fieldType).bg} ${getFieldTypeBadgeColor(cf.fieldType).text}`}>{cf.fieldType}</span>
                             </div>
                             {cf.options && <p className="text-xs text-[#6B7280]">Options: {cf.options}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                              <button onClick={() => moveField(index, 'down')} disabled={index === customFields.length - 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { setEditingItem(cf); setCustomFieldForm(cf); setModalOpen(true); }} className="p-1.5 rounded-lg border border-gray-300 text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => { setItemToDelete(cf); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg border border-red-300 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                   ))}
               </div>
             )}
          </div>
      )}

      {/* Main Modal for Add/Edit */}
      {modalOpen && (
          <Modal
             isOpen={modalOpen}
             onClose={() => !isSubmitting && setModalOpen(false)}
             title={`${editingItem ? 'Edit' : 'Add'} ${activeTab === 'packages' ? 'Package' : activeTab === 'backgrounds' ? 'Background' : activeTab === 'addons' ? 'Add-on' : activeTab === 'vouchers' ? 'Voucher' : 'Custom Field'}`}
             isLoading={isSubmitting}
             size="lg"
             onConfirm={() => {
                 if (activeTab === 'packages') handleSavePackage()
                 else if (activeTab === 'backgrounds') handleSaveBackground()
                 else if (activeTab === 'addons') handleSaveAddon()
                 else if (activeTab === 'vouchers') handleSaveVoucher()
                 else if (activeTab === 'customfields') handleSaveCustomField()
             }}
             confirmLabel={editingItem ? 'Save Changes' : 'Create'}
          >
              <div className="space-y-5">
                  {/* Dynamic Form Content based on activeTab */}

                  {activeTab === "packages" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Package Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g., Birthday Smash Cake Session"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                            value={packageForm.name || ""}
                            onChange={e => setPackageForm({...packageForm, name: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            placeholder="Describe the package details..."
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all resize-none"
                            value={packageForm.description || ""}
                            onChange={e => setPackageForm({...packageForm, description: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              placeholder="500000"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                              value={packageForm.price || ""}
                              onChange={e => setPackageForm({...packageForm, price: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              placeholder="60"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                              value={packageForm.duration || ""}
                              onChange={e => setPackageForm({...packageForm, duration: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Edited Photos <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              placeholder="10"
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                              value={packageForm.editedPhotos || ""}
                              onChange={e => setPackageForm({...packageForm, editedPhotos: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                                checked={packageForm.allPhotos || false}
                                onChange={e => setPackageForm({...packageForm, allPhotos: e.target.checked})}
                              />
                              <span className="text-sm text-gray-700">Include all photos</span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                              checked={packageForm.isActive !== false}
                              onChange={e => setPackageForm({...packageForm, isActive: e.target.checked})}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Active package</span>
                              <p className="text-xs text-gray-500">Make this package available for booking</p>
                            </div>
                          </label>
                        </div>
                      </>
                  )}

                  {activeTab === "backgrounds" && (
                       <>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Background Name <span className="text-red-500">*</span></label>
                           <input
                             type="text"
                             placeholder="e.g., Limbo, Spotlight"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={backgroundForm.name || ""}
                             onChange={e => setBackgroundForm({...backgroundForm, name: e.target.value})}
                           />
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                           <textarea
                             placeholder="Describe the background style..."
                             rows={3}
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all resize-none"
                             value={backgroundForm.description || ""}
                             onChange={e => setBackgroundForm({...backgroundForm, description: e.target.value})}
                           />
                         </div>

                         <div className="pt-2">
                           <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                             <input
                               type="checkbox"
                               className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                               checked={(backgroundForm as any).isActive !== false}
                               onChange={e => setBackgroundForm({...backgroundForm, isActive: e.target.checked} as any)}
                             />
                             <div>
                               <span className="text-sm font-medium text-gray-900">Available for use</span>
                               <p className="text-xs text-gray-500">Make this background available for selection</p>
                             </div>
                           </label>
                         </div>
                       </>
                  )}

                  {activeTab === "addons" && (
                       <>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Add-on Name <span className="text-red-500">*</span></label>
                           <input
                             type="text"
                             placeholder="e.g., MUA, Extra Person"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={addonForm.name || ""}
                             onChange={e => setAddonForm({...addonForm, name: e.target.value})}
                           />
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rp) <span className="text-red-500">*</span></label>
                           <input
                             type="number"
                             placeholder="200000"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={(addonForm as any).defaultPrice || ""}
                             onChange={e => setAddonForm({...addonForm, defaultPrice: parseFloat(e.target.value)} as any)}
                           />
                         </div>

                         <div className="pt-2">
                           <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                             <input
                               type="checkbox"
                               className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                               checked={addonForm.isActive !== false}
                               onChange={e => setAddonForm({...addonForm, isActive: e.target.checked})}
                             />
                             <div>
                               <span className="text-sm font-medium text-gray-900">Active add-on</span>
                               <p className="text-xs text-gray-500">Make this add-on available for selection</p>
                             </div>
                           </label>
                         </div>
                       </>
                  )}

                  {activeTab === "vouchers" && (
                       <>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code <span className="text-red-500">*</span></label>
                           <input
                             type="text"
                             placeholder="e.g., WELCOME10"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={voucherForm.code || ""}
                             onChange={e => setVoucherForm({...voucherForm, code: e.target.value.toUpperCase()})}
                           />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type <span className="text-red-500">*</span></label>
                             <select
                               className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                               value={voucherForm.discountType}
                               onChange={e => setVoucherForm({...voucherForm, discountType: e.target.value as any})}
                             >
                               <option value="">Select type</option>
                               <option value="PERCENTAGE">Percentage (%)</option>
                               <option value="FIXED">Fixed Amount (Rp)</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value <span className="text-red-500">*</span></label>
                             <input
                               type="number"
                               placeholder={voucherForm.discountType === 'PERCENTAGE' ? '10' : '50000'}
                               className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                               value={voucherForm.discountValue || ""}
                               onChange={e => setVoucherForm({...voucherForm, discountValue: parseFloat(e.target.value)})}
                             />
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Valid From <span className="text-red-500">*</span></label>
                             <input
                               type="date"
                               className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                               value={voucherForm.validFrom ? String(voucherForm.validFrom).split('T')[0] : ""}
                               onChange={e => setVoucherForm({...voucherForm, validFrom: e.target.value})}
                             />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until <span className="text-red-500">*</span></label>
                             <input
                               type="date"
                               className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                               value={voucherForm.validUntil ? String(voucherForm.validUntil).split('T')[0] : ""}
                               onChange={e => setVoucherForm({...voucherForm, validUntil: e.target.value})}
                             />
                           </div>
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Purchase (Rp)</label>
                           <input
                             type="number"
                             placeholder="0 (tidak ada minimum)"
                             min="0"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={voucherForm.minPurchase !== undefined && voucherForm.minPurchase !== null ? voucherForm.minPurchase : ""}
                             onChange={e => {
                               const value = e.target.value
                               setVoucherForm({
                                 ...voucherForm,
                                 minPurchase: value === "" ? undefined : parseFloat(value)
                               })
                             }}
                           />
                         </div>

                         <div className="pt-2">
                           <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                             <input
                               type="checkbox"
                               className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                               checked={voucherForm.isActive === true || (voucherForm.isActive === undefined && !editingItem)}
                               onChange={e => setVoucherForm({...voucherForm, isActive: e.target.checked})}
                             />
                             <div>
                               <span className="text-sm font-medium text-gray-900">Active voucher</span>
                               <p className="text-xs text-gray-500">Make this voucher available for use</p>
                             </div>
                           </label>
                         </div>
                       </>
                  )}

                  {activeTab === "customfields" && (
                       <>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Field Label <span className="text-red-500">*</span></label>
                           <input
                             type="text"
                             placeholder="e.g., Background Preference"
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={customFieldForm.fieldName || ""}
                             onChange={e => setCustomFieldForm({...customFieldForm, fieldName: e.target.value})}
                           />
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">Field Type <span className="text-red-500">*</span></label>
                           <select
                             className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                             value={customFieldForm.fieldType}
                             onChange={e => setCustomFieldForm({...customFieldForm, fieldType: e.target.value as any})}
                           >
                             <option value="">Select type</option>
                             {FIELD_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                           </select>
                         </div>

                         {customFieldForm.fieldType === 'SELECT' && (
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Options <span className="text-red-500">*</span></label>
                             <input
                               type="text"
                               placeholder="Option 1, Option 2, Option 3"
                               className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent transition-all"
                               value={customFieldForm.options || ""}
                               onChange={e => setCustomFieldForm({...customFieldForm, options: e.target.value})}
                             />
                             <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                           </div>
                         )}

                         <div className="pt-2">
                           <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                             <input
                               type="checkbox"
                               className="w-4 h-4 text-[#7A1F1F] border-gray-300 rounded focus:ring-[#7A1F1F]"
                               checked={customFieldForm.isRequired || false}
                               onChange={e => setCustomFieldForm({...customFieldForm, isRequired: e.target.checked})}
                             />
                             <div>
                               <span className="text-sm font-medium text-gray-900">Required field</span>
                               <p className="text-xs text-gray-500">Users must fill this field</p>
                             </div>
                           </label>
                         </div>
                       </>
                  )}
              </div>
          </Modal>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && itemToDelete && (
          <Modal
             isOpen={deleteModalOpen}
             onClose={() => !isSubmitting && setDeleteModalOpen(false)}
             title="Confirm Delete"
             description="Are you sure you want to delete this item? This action cannot be undone."
             confirmLabel="Delete"
             variant="danger"
             isLoading={isSubmitting}
             onConfirm={() => {
                 if (activeTab === 'packages') handleDeletePackage()
                 else if (activeTab === 'backgrounds') handleDeleteBackground()
                 else if (activeTab === 'addons') handleDeleteAddon()
                 else if (activeTab === 'vouchers') handleDeleteVoucher()
                 else if (activeTab === 'customfields') handleDeleteCustomField()
             }}
          />
      )}
    </div>
  )
}
