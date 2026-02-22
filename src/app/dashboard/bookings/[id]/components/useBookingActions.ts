import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"
import { apiPatch, apiDelete } from "@/lib/api-client"
import { BookingStatus, PaymentStatus, PrintOrderStatus, PrintOrder } from "@/lib/types"

export function useBookingActions(id: string, mutate: () => void, booking: any, addOnTemplates: any[]) {
  const router = useRouter()
  const { showToast } = useToast()

  const [isUpdating, setIsUpdating] = useState(false)
  const [updatingAction, setUpdatingAction] = useState<"PAID" | "UNPAID" | "PARTIALLY_PAID" | null>(null)
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false)

  // Add-on states
  const [selectedAddOnId, setSelectedAddOnId] = useState("")
  const [addOnQty, setAddOnQty] = useState(1)
  const [showPaidBookingWarning, setShowPaidBookingWarning] = useState(false)
  const [pendingAddOnAction, setPendingAddOnAction] = useState<'add' | 'remove' | null>(null)
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null)

  const handleUpdateStatus = async (newStatus: BookingStatus) => {
    setIsUpdating(true)
    try {
        const res = await apiPatch(`/api/bookings/${id}/status`, { status: newStatus })
        if (res.error) throw new Error(res.error)
        mutate()
        showToast(`Status updated to ${newStatus}`, "success")
    } catch (error: any) {
        showToast(error.message, "error")
    } finally {
        setIsUpdating(false)
    }
  }

  const handleUpdatePayment = async (status: PaymentStatus) => {
      setIsUpdating(true)
      setUpdatingAction(status)
      try {
          const res = await apiPatch(`/api/bookings/${id}/status`, { paymentStatus: status })
          if (res.error) throw new Error(res.error)
          mutate()
          showToast(`Payment status updated to ${status}`, "success")
      } catch (error: any) {
           showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
          setUpdatingAction(null)
      }
  }

  const handleUpdatePrintOrder = async (data: Partial<PrintOrder>) => {
      setIsUpdating(true)
      try {
          const res = await apiPatch(`/api/bookings/${id}/print-order`, data)
          if (res.error) throw new Error(res.error)
          mutate()
          showToast("Print order updated", "success")
      } catch (error: any) {
          showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
      }
  }

  const handleUpdatePrintStatus = async (newStatus: PrintOrderStatus) => {
      handleUpdatePrintOrder({ status: newStatus })
  }

  const handleDeletePrintOrder = async () => {
      setIsUpdating(true)
      try {
          const res = await apiDelete(`/api/bookings/${id}/print-order`)
          if (res.error) throw new Error(res.error)
          mutate()
          showToast("Print order cancelled successfully", "success")
      } catch (error: any) {
          showToast(error.message, "error")
      } finally {
          setIsUpdating(false)
      }
  }

  const handleUpdatePhotoLink = async (photoLinkValue: string) => {
       setIsUpdating(true)
       try {
           const res = await apiPatch(`/api/bookings/${id}/status`, { photoLink: photoLinkValue })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Photo link updated", "success")
       } catch (error: any) {
           showToast(error.message, "error")
       } finally {
        setIsUpdating(false)
       }
  }

  const handleDelete = async () => {
    try {
        const res = await apiDelete(`/api/bookings/${id}`)
        if (res.error) throw new Error(res.error)
        showToast("Booking deleted", "success")
        router.push("/dashboard/bookings")
    } catch (error: any) {
        showToast(error.message, "error")
    }
  }

  const handleAddAddOn = async () => {
       if (!selectedAddOnId) return

       // Check if booking is PAID and show warning first
       if (booking.paymentStatus === 'PAID' && !pendingAddOnAction) {
           setShowPaidBookingWarning(true)
           setPendingAddOnAction('add')
           return
       }

       const template = addOnTemplates.find(t => t.id === selectedAddOnId)
       if (!template) return
       const newItem = { itemName: template.name, quantity: addOnQty, unitPrice: template.defaultPrice }
       const currentAddOns = booking.addOns.map((ao: any) => ({ itemName: ao.itemName, quantity: ao.quantity, unitPrice: ao.unitPrice }))
       const newAddOnsList = [...currentAddOns, newItem]
       try {
           const res = await apiPatch(`/api/bookings/${id}`, { addOns: newAddOnsList })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Add-on added successfully", "success")
           setIsAddOnModalOpen(false)
           setSelectedAddOnId("")
           setAddOnQty(1)
           setPendingAddOnAction(null) // Reset warning state
       } catch (error: any) {
           showToast(error.message, "error")
       }
  }

  const handleRemoveAddOn = async (index: number) => {
       // Check if booking is PAID and show warning first
       if (booking.paymentStatus === 'PAID' && pendingRemoveIndex === null) {
           setShowPaidBookingWarning(true)
           setPendingAddOnAction('remove')
           setPendingRemoveIndex(index)
           return
       }

       const currentAddOns = booking.addOns.map((ao: any) => ({ itemName: ao.itemName, quantity: ao.quantity, unitPrice: ao.unitPrice }))
       currentAddOns.splice(index, 1)
       try {
           const res = await apiPatch(`/api/bookings/${id}`, { addOns: currentAddOns })
           if (res.error) throw new Error(res.error)
           mutate()
           showToast("Add-on removed successfully", "success")
           setPendingAddOnAction(null) // Reset warning state
           setPendingRemoveIndex(null)
       } catch (error: any) {
           showToast(error.message, "error")
       }
  }

  const handleCopyCustomerLink = () => {
    const customerPageUrl = `${window.location.origin}/status/${booking.publicSlug}`
    navigator.clipboard.writeText(customerPageUrl)
      .then(() => {
        showToast("Link customer page berhasil disalin!", "success")
      })
      .catch(() => {
        showToast("Gagal menyalin link", "error")
      })
  }

  return {
    isUpdating,
    updatingAction,
    deleteModalOpen,
    setDeleteModalOpen,
    cancelModalOpen,
    setCancelModalOpen,
    isAddOnModalOpen,
    setIsAddOnModalOpen,
    selectedAddOnId,
    setSelectedAddOnId,
    addOnQty,
    setAddOnQty,
    showPaidBookingWarning,
    setShowPaidBookingWarning,
    pendingAddOnAction,
    setPendingAddOnAction,
    pendingRemoveIndex,
    setPendingRemoveIndex,
    handleUpdateStatus,
    handleUpdatePayment,
    handleUpdatePrintOrder,
    handleUpdatePrintStatus,
    handleDeletePrintOrder,
    handleUpdatePhotoLink,
    handleDelete,
    handleAddAddOn,
    handleRemoveAddOn,
    handleCopyCustomerLink,
  }
}
