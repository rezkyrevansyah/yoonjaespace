import { cn, formatDate } from "@/lib/utils"
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  Film, 
  Send, 
  Link as LinkIcon, 
  Printer, 
  Trash2 
} from "lucide-react"
import { BookingStatus, PrintOrderStatus } from "@/lib/types"

interface ProgressTabProps {
  booking: any;
  user: any;
  currentStepIndex: number;
  isCancelled: boolean;
  availableStatusOptions: BookingStatus[];
  canChangeStatus: boolean;
  isUpdating: boolean;
  selectedBookingStatus: BookingStatus | "";
  setSelectedBookingStatus: (s: BookingStatus | "") => void;
  handleUpdateStatus: (s: BookingStatus, additionalData?: any) => void;
  photoLinkValue: string;
  setPhotoLinkValue: (v: string) => void;
  handleUpdatePhotoLink: () => void;
  handleUpdatePrintStatus: (s: PrintOrderStatus) => void;
  setCancelModalOpen: (v: boolean) => void;
  selectedPrintStatus: PrintOrderStatus | "";
  setSelectedPrintStatus: (s: PrintOrderStatus | "") => void;
  selectedPhotosValue: string;
  setSelectedPhotosValue: (v: string) => void;
  handleUpdatePrintOrder: (data: any) => void;
  STEP_LABELS: Record<BookingStatus, string>;
  PRINT_STATUS_STEPS: { status: PrintOrderStatus; label: string }[];
  showToast: (m: string, t: string) => void;
}

export function ProgressTab({
  booking,
  currentStepIndex,
  isCancelled,
  availableStatusOptions,
  canChangeStatus,
  isUpdating,
  selectedBookingStatus,
  setSelectedBookingStatus,
  handleUpdateStatus,
  photoLinkValue,
  setPhotoLinkValue,
  handleUpdatePhotoLink,
  handleUpdatePrintStatus,
  setCancelModalOpen,
  selectedPrintStatus,
  setSelectedPrintStatus,
  selectedPhotosValue,
  setSelectedPhotosValue,
  handleUpdatePrintOrder,
  STEP_LABELS,
  PRINT_STATUS_STEPS,
  showToast,
}: ProgressTabProps) {
  return (
    <div className={cn("grid gap-6 items-start mx-auto", booking.printOrder ? "grid-cols-1 lg:grid-cols-2 max-w-7xl" : "grid-cols-1 max-w-2xl")}>
      {/* Status & Action */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-amber-500">
        <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Progress & Actions</h2>
        </div>
        
        <div className="p-5 space-y-6">
          {/* Progress Stepper */}
          {!isCancelled ? (
            <div 
              className="grid gap-2" 
              style={{ gridTemplateColumns: `repeat(${availableStatusOptions.length}, minmax(0, 1fr))` }}
            >
              {availableStatusOptions.map((step, index) => {
                const isCompleted = currentStepIndex > index
                const isCurrent = currentStepIndex === index
                const stepColors = [
                  { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500/10', text: 'text-blue-600' },
                  { bg: 'bg-green-500', border: 'border-green-500', ring: 'ring-green-500/10', text: 'text-green-600' },
                  { bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500/10', text: 'text-purple-600' },
                  { bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500/10', text: 'text-amber-600' },
                  { bg: 'bg-[#7A1F1F]', border: 'border-[#7A1F1F]', ring: 'ring-[#7A1F1F]/10', text: 'text-[#7A1F1F]' },
                ]
                const color = stepColors[index]
                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? `${color.bg} ${color.border}`
                        : isCurrent
                        ? `bg-white ${color.border} ring-4 ${color.ring}`
                        : "bg-white border-gray-200"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <span className={`text-xs font-black ${isCurrent ? color.text : "text-gray-300"}`}>{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold leading-none text-center ${
                      isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                    }`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 bg-red-50 rounded-xl border border-red-100">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
            </div>
          )}

          {/* Change Status Control */}
          {!isCancelled && (
            <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="relative flex-1">
                <select
                  value={selectedBookingStatus || booking.status}
                  onChange={(e) => setSelectedBookingStatus(e.target.value as any)}
                  className="w-full appearance-none bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  disabled={isUpdating || !canChangeStatus}
                >
                  {availableStatusOptions.map((step) => (
                    <option key={step} value={step}>{STEP_LABELS[step]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => {
                  const s = selectedBookingStatus || booking.status
                  if (s) handleUpdateStatus(s as any)
                }}
                disabled={isUpdating || !canChangeStatus}
                className="px-4 py-2.5 bg-[#7A1F1F] text-white rounded-lg text-sm font-bold hover:bg-[#601818] transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {isUpdating ? <span className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving</span> : "Update"}
              </button>
            </div>
          )}

          {/* Contextual Action Area */}
          {booking.status === "CLOSED" && (
            <div className="flex items-center justify-center gap-2 py-4 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-bold text-green-700">Order Completed</span>
            </div>
          )}

          {/* Photo Link Input (SHOOT_DONE and beyond) */}
          {(currentStepIndex >= 1 && !isCancelled) && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <Film className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Google Drive Link</span>
              </div>
              <div className="p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Google Drive link here..."
                  value={photoLinkValue}
                  onChange={(e) => setPhotoLinkValue(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A1F1F] focus:ring-1 focus:ring-[#7A1F1F]/20 transition-all"
                />
                {booking.status !== "SHOOT_DONE" && (
                  <button
                    onClick={handleUpdatePhotoLink}
                    disabled={isUpdating}
                    className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Save
                  </button>
                )}
                {booking.status !== "SHOOT_DONE" && photoLinkValue && (
                   <a
                      href={photoLinkValue.startsWith('http') ? photoLinkValue : `https://${photoLinkValue}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                      title="Open link"
                   >
                     <LinkIcon className="h-3.5 w-3.5" />
                   </a>
                )}
              </div>
              <p className="px-4 pb-2.5 text-[10px] text-gray-400 italic">Pastikan link bisa diakses publik</p>
            </div>
          )}

          {/* Shoot Done → Deliver */}
          {booking.status === "SHOOT_DONE" && (
            <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <p className="text-sm font-semibold text-amber-800">Foto sudah siap?</p>
                <p className="text-xs text-amber-600 mt-0.5">Masukkan link di atas, lalu klik Deliver.</p>
              </div>
              <button
                onClick={() => {
                  if (!photoLinkValue) { showToast("Link Google Drive wajib diisi!", "warning"); return }
                  handleUpdateStatus("PHOTOS_DELIVERED", { photoLink: photoLinkValue })
                }}
                disabled={isUpdating}
                className="shrink-0 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                Deliver
              </button>
            </div>
          )}

          {/* Photos Delivered → Print / Close */}
          {booking.status === "PHOTOS_DELIVERED" && (
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                onClick={() => handleUpdatePrintStatus('WAITING_CLIENT_SELECTION')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                {booking.printOrder ? "Update Print" : "Start Print"}
              </button>
              <button
                onClick={() => handleUpdateStatus("CLOSED")}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Close Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRINT ORDER TRACKING */}
      {booking.printOrder && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit border-t-4 border-t-cyan-500">
          <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Printer className="h-3.5 w-3.5 text-cyan-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Print Order</h2>
            </div>
            <button
              onClick={() => setCancelModalOpen(true)}
              disabled={isUpdating}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Cancel print order"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Print Stepper */}
            <div className="grid grid-cols-7 gap-1.5">
              {(() => {
                const currentIdx = PRINT_STATUS_STEPS.findIndex(s => s.status === booking.printOrder?.status)
                const printColors = [
                  { bg: 'bg-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500/10', text: 'text-indigo-600' },
                  { bg: 'bg-cyan-500', border: 'border-cyan-500', ring: 'ring-cyan-500/10', text: 'text-cyan-600' },
                  { bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-500/10', text: 'text-orange-600' },
                  { bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500/10', text: 'text-emerald-600' },
                  { bg: 'bg-pink-500', border: 'border-pink-500', ring: 'ring-pink-500/10', text: 'text-pink-600' },
                  { bg: 'bg-violet-500', border: 'border-violet-500', ring: 'ring-violet-500/10', text: 'text-violet-600' },
                  { bg: 'bg-[#7A1F1F]', border: 'border-[#7A1F1F]', ring: 'ring-[#7A1F1F]/10', text: 'text-[#7A1F1F]' },
                ]
                return PRINT_STATUS_STEPS.map((step, idx) => {
                  const isCompleted = currentIdx >= idx
                  const isCurrent = booking.printOrder?.status === step.status
                  const color = printColors[idx]
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? `${color.bg} ${color.border}`
                          : isCurrent
                          ? `bg-white ${color.border} ring-4 ${color.ring}`
                          : "bg-white border-gray-200"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <span className={`text-[10px] font-black ${isCurrent ? color.text : "text-gray-300"}`}>{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wide leading-none text-center ${
                        isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Change Print Status */}
            <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="relative flex-1">
                <select
                  value={selectedPrintStatus || booking.printOrder.status}
                  onChange={(e) => setSelectedPrintStatus(e.target.value as any)}
                  className="w-full appearance-none bg-white text-gray-800 text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  disabled={isUpdating}
                >
                  {PRINT_STATUS_STEPS.map((step) => (
                    <option key={step.status} value={step.status}>{step.label} — {step.status.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button
                 onClick={() => {
                    const s = selectedPrintStatus || booking.printOrder?.status
                    if (s) handleUpdatePrintStatus(s as any)
                 }}
                disabled={isUpdating}
                className="px-4 py-2.5 bg-[#7A1F1F] text-white rounded-lg text-sm font-bold hover:bg-[#601818] transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {isUpdating ? "..." : "Update"}
              </button>
            </div>

            {/* Print Details textarea */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 pt-4 pb-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Selected Photos / Link</label>
                  <button
                    onClick={() => handleUpdatePrintOrder({ selectedPhotos: selectedPhotosValue })}
                    disabled={isUpdating}
                    className="text-xs text-[#7A1F1F] font-bold hover:underline disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
                <textarea
                  value={selectedPhotosValue}
                  onChange={(e) => setSelectedPhotosValue(e.target.value)}
                  placeholder="Paste link or list photo numbers..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7A1F1F] min-h-[72px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Vendor</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.printOrder.vendorName || "—"}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tracking</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{booking.printOrder.trackingNumber || "Pending"}</p>
                  {booking.printOrder.courier && <p className="text-xs text-gray-400">{booking.printOrder.courier}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
