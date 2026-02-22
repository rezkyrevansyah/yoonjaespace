import { Modal } from "@/components/shared/modal"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface BookingModalsProps {
  deleteModalOpen: boolean;
  setDeleteModalOpen: (v: boolean) => void;
  handleDelete: () => void;
  cancelModalOpen: boolean;
  setCancelModalOpen: (v: boolean) => void;
  handleDeletePrintOrder: () => void;
  isAddOnModalOpen: boolean;
  setIsAddOnModalOpen: (v: boolean) => void;
  selectedAddOnId: string;
  setSelectedAddOnId: (v: string) => void;
  addOnTemplates: any[];
  addOnQty: number;
  setAddOnQty: (v: number) => void;
  handleAddAddOn: () => void;
  showPaidBookingWarning: boolean;
  setShowPaidBookingWarning: (v: boolean) => void;
  setPendingAddOnAction: (v: any) => void;
  setPendingRemoveIndex: (v: any) => void;
  pendingAddOnAction: any;
  pendingRemoveIndex: any;
  handleRemoveAddOn: (idx: number) => void;
}

export function BookingModals({
  deleteModalOpen,
  setDeleteModalOpen,
  handleDelete,
  cancelModalOpen,
  setCancelModalOpen,
  handleDeletePrintOrder,
  isAddOnModalOpen,
  setIsAddOnModalOpen,
  selectedAddOnId,
  setSelectedAddOnId,
  addOnTemplates,
  addOnQty,
  setAddOnQty,
  handleAddAddOn,
  showPaidBookingWarning,
  setShowPaidBookingWarning,
  setPendingAddOnAction,
  setPendingRemoveIndex,
  pendingAddOnAction,
  pendingRemoveIndex,
  handleRemoveAddOn,
}: BookingModalsProps) {
  return (
    <>
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Print Order?"
        description="This will permanently delete the print order tracking data. Are you sure?"
        confirmLabel="Yes, Cancel"
        variant="danger"
        onConfirm={() => { handleDeletePrintOrder(); setCancelModalOpen(false) }}
      />

      <Modal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        title="Add Add-on Item"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Item</label>
            <select
              value={selectedAddOnId}
              onChange={(e) => setSelectedAddOnId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20"
            >
              <option value="">— Choose item —</option>
              {addOnTemplates?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} · {formatCurrency(t.defaultPrice)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min="1"
              value={addOnQty}
              onChange={(e) => setAddOnQty(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setIsAddOnModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleAddAddOn} className="flex-1 py-2.5 bg-[#7A1F1F] text-white rounded-xl text-sm font-bold hover:bg-[#601818] transition-colors shadow-sm">Add Item</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPaidBookingWarning}
        onClose={() => {
          setShowPaidBookingWarning(false)
          setPendingAddOnAction(null)
          setPendingRemoveIndex(null)
        }}
        title="Modify PAID Booking?"
        confirmLabel="Continue"
        onConfirm={() => {
          setShowPaidBookingWarning(false)
          if (pendingAddOnAction === 'add') {
            handleAddAddOn()
          } else if (pendingAddOnAction === 'remove' && pendingRemoveIndex !== null) {
            handleRemoveAddOn(pendingRemoveIndex)
          }
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              This booking is currently marked as <span className="font-bold">PAID</span>.
            </p>
          </div>
          <p className="text-sm text-gray-700">
            {pendingAddOnAction === 'add'
              ? 'Adding this add-on will increase the total amount and automatically change the payment status to PARTIALLY PAID.'
              : 'Removing this add-on will decrease the total amount and may change the payment status.'}
          </p>
          <p className="text-xs text-gray-500">
            The payment status will be automatically recalculated based on existing payment records.
          </p>
        </div>
      </Modal>
    </>
  )
}
