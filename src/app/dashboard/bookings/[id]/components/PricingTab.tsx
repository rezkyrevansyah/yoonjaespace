import { formatCurrency, cn } from "@/lib/utils"
import { StatusBadge } from "@/components/shared/status-badge"
import { 
  CreditCard, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle 
} from "lucide-react"

interface PricingTabProps {
  booking: any;
  packagePrice: number;
  discount: number;
  setIsAddOnModalOpen: (v: boolean) => void;
  handleRemoveAddOn: (index: number) => void;
  handleUpdateAddOnPayment: (addonId: string, status: any) => void;
  handleUpdatePayment: (s: any) => void;
  isUpdating: boolean;
  updatingAction: string | null;
}

export function PricingTab({
  booking,
  packagePrice,
  discount,
  setIsAddOnModalOpen,
  handleRemoveAddOn,
  handleUpdateAddOnPayment,
  handleUpdatePayment,
  isUpdating,
  updatingAction,
}: PricingTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-7xl mx-auto">
      {/* Add-ons Management */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit border-t-4 border-t-purple-500">
        <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Kelola Add-ons</h3>
          </div>
          <button
            onClick={() => setIsAddOnModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah
          </button>
        </div>

        <div className="p-5">
          {booking.addOns && booking.addOns.length > 0 ? (
            <div className="space-y-3">
              {booking.addOns.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-3 py-3 border border-gray-100 bg-gray-50 rounded-xl px-4 group hover:border-gray-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.itemName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.quantity}× {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-bold text-gray-900 bg-white px-2.5 py-1 rounded shadow-sm border border-gray-100">{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</span>
                      <button
                        onClick={() => handleRemoveAddOn(idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove add-on"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Status Pembayaran Add-on */}
                  {item.id && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 mt-1">
                       <StatusBadge status={item.paymentStatus || 'UNPAID'} type="payment" />
                       
                       {/* Toggle Button for Add-on API */}
                       <button
                          onClick={() => handleUpdateAddOnPayment(item.id, item.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID')}
                          disabled={isUpdating}
                          className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5",
                            item.paymentStatus === 'PAID' 
                              ? "bg-white text-gray-500 border-gray-200 hover:bg-gray-50" 
                              : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          )}
                       >
                          {item.paymentStatus === 'PAID' ? (
                             <>Batalkan Lunas</>
                          ) : (
                             <><CheckCircle className="w-3.5 h-3.5" /> Tandai Lunas</>
                          )}
                       </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Belum ada add-ons</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit border-t-4 border-t-[#7A1F1F]">
        <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#7A1F1F]/10 flex items-center justify-center">
            <CreditCard className="h-3.5 w-3.5 text-[#7A1F1F]" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ringkasan Harga</h3>
        </div>

        <div className="p-5 space-y-6">
          {/* Line Items */}
          <div className="space-y-3 text-sm border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 border-dashed">
              <span className="font-semibold text-gray-700">{booking.package?.name || "Package"}</span>
              <span className="font-bold text-gray-900">{formatCurrency(packagePrice)}</span>
            </div>
            {booking.addOns && booking.addOns.length > 0 && (
              <div className="space-y-2 pt-1">
                {booking.addOns.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>{item.itemName} ×{item.quantity}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium pt-2 border-t border-gray-200 border-dashed">
                <span>Discount</span>
                <span>−{formatCurrency(discount)}</span>
              </div>
            )}
          </div>

          {/* Total Block */}
          <div className="rounded-xl bg-[#7A1F1F] p-5 shadow-inner">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm font-bold text-white/80">Total Pembayaran</span>
              <span className="text-3xl font-black text-white">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <span className="text-xs text-white/70 font-medium tracking-wide uppercase">Status Payment</span>
              <StatusBadge status={booking.paymentStatus} type="payment" />
            </div>
          </div>

          {/* Payment Toggle */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleUpdatePayment('PAID')}
              disabled={booking.paymentStatus === 'PAID' || isUpdating}
              className="py-3 bg-green-50 text-green-700 text-sm font-bold rounded-xl border border-green-200 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isUpdating && updatingAction === 'PAID' ? (
                <div className="w-4 h-4 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
              ) : <CheckCircle className="h-4 w-4" />}
              Mark as Paid
            </button>
            <button
              onClick={() => handleUpdatePayment('UNPAID')}
              disabled={booking.paymentStatus === 'UNPAID' || isUpdating}
              className="py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isUpdating && updatingAction === 'UNPAID' ? (
                <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
              ) : <XCircle className="h-4 w-4" />}
              Mark Unpaid
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
