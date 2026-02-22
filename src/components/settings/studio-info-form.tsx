"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, MapPin, Phone, Instagram, Mail, MessageSquare, Navigation, Image as ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"
import Image from "next/image"

interface StudioInfoFormProps {
  initialData?: {
    studioName?: string
    logoUrl?: string
    studioPhotoUrl?: string
    address?: string
    mapsUrl?: string
    mapsLatitude?: string
    mapsLongitude?: string
    phoneNumber?: string
    whatsappNumber?: string
    email?: string
    instagram?: string
    footerText?: string
  }
  onSave?: () => void
}

export function StudioInfoForm({ initialData, onSave }: StudioInfoFormProps) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    studioName: initialData?.studioName || "",
    logoUrl: initialData?.logoUrl || "",
    studioPhotoUrl: initialData?.studioPhotoUrl || "",
    address: initialData?.address || "",
    mapsUrl: initialData?.mapsUrl || "",
    phoneNumber: initialData?.phoneNumber || "",
    whatsappNumber: initialData?.whatsappNumber || "",
    email: initialData?.email || "",
    instagram: initialData?.instagram || "",
    footerText: initialData?.footerText || "Thank you for choosing Yoonjaespace Studio!",
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        studioName: initialData.studioName || "",
        logoUrl: initialData.logoUrl || "",
        studioPhotoUrl: initialData.studioPhotoUrl || "",
        address: initialData.address || "",
        mapsUrl: initialData.mapsUrl || "",
        phoneNumber: initialData.phoneNumber || "",
        whatsappNumber: initialData.whatsappNumber || "",
        email: initialData.email || "",
        instagram: initialData.instagram || "",
        footerText: initialData.footerText || "Thank you for choosing Yoonjaespace Studio!",
      })
    }
  }, [initialData])

  const handleFileUpload = async (file: File, type: 'logo' | 'studio_photo') => {
    if (type === 'logo') {
      setIsUploadingLogo(true)
    } else {
      setIsUploadingPhoto(true)
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/settings/studio/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.details || errorData.error || 'Upload failed')
      }

      const data = await response.json()

      setForm(prev => ({
        ...prev,
        [type === 'logo' ? 'logoUrl' : 'studioPhotoUrl']: data.url
      }))

      showToast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Studio photo'} uploaded successfully`,
        variant: "success"
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      showToast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "error"
      })
    } finally {
      if (type === 'logo') {
        setIsUploadingLogo(false)
      } else {
        setIsUploadingPhoto(false)
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/settings/studio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }

      showToast({
        title: "Success",
        description: "Studio settings saved successfully",
        variant: "success"
      })

      onSave?.()
    } catch (error) {
      console.error('Save error:', error)
      showToast({
        title: "Error",
        description: "Failed to save settings",
        variant: "error"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Studio Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#7A1F1F]" />
          Studio Logo (Bulat)
        </h3>
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50">
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt="Studio Logo"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'logo')
              }}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="px-4 py-2 bg-[#7A1F1F] text-white text-sm font-medium rounded-lg hover:bg-[#601818] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Rekomendasi: Square (1:1), min 200x200px. Akan ditampilkan dalam bentuk bulat.
            </p>
          </div>
        </div>
      </div>

      {/* Studio Front Photo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#7A1F1F]" />
          Foto Tampak Depan Studio
        </h3>
        <div className="space-y-4">
          {form.studioPhotoUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={form.studioPhotoUrl}
                alt="Studio Photo"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'studio_photo')
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="px-4 py-2 bg-[#7A1F1F] text-white text-sm font-medium rounded-lg hover:bg-[#601818] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Foto Studio
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Foto ini akan ditampilkan di Customer Page. Rekomendasi: 16:9, min 800x450px
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Studio</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Studio
            </label>
            <input
              type="text"
              value={form.studioName}
              onChange={(e) => setForm({ ...form, studioName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
              placeholder="Yoonjaespace Studio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Alamat
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
              rows={3}
              placeholder="Jl. Contoh No. 123, Jakarta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Google Maps URL
            </label>
            <input
              type="url"
              value={form.mapsUrl}
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Klik kanan pada Google Maps → Share → Copy link
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Kontak</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
                placeholder="08123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </label>
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
                placeholder="08123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
              placeholder="hello@yoonjaespace.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </label>
            <input
              type="url"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
              placeholder="https://instagram.com/yoonjaespace"
            />
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Footer Text (Customer Page & Invoice)</h3>
        <div>
          <textarea
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:border-transparent text-sm"
            rows={2}
            placeholder="Thank you for choosing Yoonjaespace Studio!"
          />
          <p className="text-xs text-gray-500 mt-1">
            Text ini akan muncul di bawah Customer Page dan Invoice
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[#7A1F1F] text-white font-medium rounded-lg hover:bg-[#601818] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  )
}
