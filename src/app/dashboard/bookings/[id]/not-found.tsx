import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BookingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-gray-50 p-6 rounded-full mb-6">
        <ArrowLeft className="h-8 w-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Tidak Ditemukan</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Maaf, data booking yang Anda cari tidak tersedia atau mungkin telah dihapus.
      </p>
      <Link
        href="/dashboard/bookings"
        className="px-6 py-2.5 bg-[#7A1F1F] text-white font-medium rounded-xl hover:bg-[#9B3333] transition-colors shadow-sm"
      >
        Kembali ke Daftar Booking
      </Link>
    </div>
  )
}
