const fs = require('fs');
const file = fs.readFileSync('src/app/dashboard/bookings/[id]/page.tsx', 'utf8');

const calculateDurationCode = `  const calculateDuration = (b: any) => {
    if (!b?.startTime || !b?.endTime) return 0;
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
  }`;

let newFile = file.replace('const packagePrice =', calculateDurationCode + '\n\n  const packagePrice =');

const startMarker = '{/* ── MAIN GRID ── */}';
const endMarkerTrue = '{/* ── MODALS ── */}';

const startIndex = newFile.indexOf(startMarker);
const endIndex = newFile.indexOf(endMarkerTrue);

if (startIndex === -1 || endIndex === -1) {
  console.log("MARKER NOT FOUND", startIndex, endIndex);
  process.exit(1);
}

const replacement = `{/* ── TOP DETAILS CARD (Issue 3) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Client</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-gray-900 leading-none">{booking.client.name}</h2>
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              <a
                href={\`https://wa.me/\${booking.client.phone.replace(/^0/, '62')}\`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-green-600 transition-colors"
                rel="noreferrer"
              >
                <Phone className="h-3.5 w-3.5" />
                {booking.client.phone}
              </a>
              {booking.client.email && (
                <a
                  href={\`mailto:\${booking.client.email}\`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {booking.client.email}
                </a>
              )}
              {booking.client.instagram && (
                <a
                  href={\`https://instagram.com/\${booking.client.instagram.replace('@', '')}\`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-pink-600 transition-colors"
                  rel="noreferrer"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  {booking.client.instagram}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
             <div className="flex flex-wrap gap-2">
                 <StatusBadge status={booking.status} type="booking" />
                 <StatusBadge status={booking.paymentStatus} type="payment" />
             </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
            {/* Date */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5"/> Tanggal</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(booking.date)}</p>
            </div>
            {/* Time */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Jam Sesi</p>
              <p className="text-sm font-semibold text-gray-900 border border-gray-200 bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                {formatDate(booking.startTime, 'HH:mm')} - {formatDate(booking.endTime, 'HH:mm')}
              </p>
            </div>
            {/* Duration */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> Durasi</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-purple-600 border border-purple-200 bg-purple-50 px-2 py-0.5 rounded-md inline-block">{calculateDuration(booking)} menit</p>
              </div>
            </div>
            {/* Package */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Package className="h-3.5 w-3.5"/> Package</p>
              <p className="text-sm font-semibold text-gray-900">{booking.package?.name || "—"}</p>
            </div>

            {/* People */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/> Jumlah Orang</p>
              <p className="text-sm font-semibold text-gray-900">{booking.numberOfPeople} orang</p>
            </div>
            {/* Photo For */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Photo For</p>
              <p className="text-sm font-semibold text-gray-900">{booking.photoFor}</p>
            </div>
            {/* Background */}
            <div className="col-span-2 lg:col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/> Background</p>
              <div className="flex flex-wrap gap-2">
                {booking.bookingBackgrounds && booking.bookingBackgrounds.length > 0 ? (
                  booking.bookingBackgrounds.map((bg: any) => (
                    <span key={bg.id} className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-md">
                      {bg.background?.name || 'Background'}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">{"—"}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Add-ons List */}
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5"/> Add-ons Terpilih</p>
                {booking.addOns && booking.addOns.length > 0 ? (
                  <div className="space-y-2">
                    {booking.addOns.map((addon: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5">
                        <span className="font-semibold text-gray-800">{addon.itemName} <span className="text-gray-400 ml-1">×{addon.quantity}</span></span>
                        <span className="font-bold text-gray-900 text-xs">{formatCurrency(addon.subtotal || addon.unitPrice * addon.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">Tidak ada add-ons</p>
                )}
             </div>

             {/* BTS & Notes */}
             <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> BTS (Behind The Scenes)</p>
                  <span className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg border inline-block",
                    booking.bts ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                  )}>
                    {booking.bts ? "Ya, BTS diminta" : "Tidak ada BTS"}
                  </span>
                </div>
                {booking.notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Catatan Client</p>
                    <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 p-3.5 rounded-xl italic font-medium leading-relaxed shadow-sm">
                      "{booking.notes}"
                    </p>
                  </div>
                )}
                {booking.internalNotes && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Internal Notes</p>
                    <p className="text-sm text-blue-900 bg-blue-50 border border-blue-100 p-3.5 rounded-xl italic font-medium leading-relaxed shadow-sm">
                      "{booking.internalNotes}"
                    </p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* ── TABS CONTENT (Issue 4) ── */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        <div className={cn("space-y-6", activeTab !== "overview" && "hidden")}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-[#7A1F1F]" /> Informasi Tambahan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Custom Fields */}
              <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 border-b border-gray-50 pb-2">Custom Fields</h4>
                  {booking.customFields && booking.customFields.length > 0 ? (
                    <div className="space-y-3">
                      {booking.customFields.map((cf: any) => (
                        <div key={cf.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{cf.field?.fieldName}</p>
                          <p className="text-sm font-semibold text-gray-900">{cf.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Tidak ada custom fields.</p>
                  )}
              </div>

              {/* Handled By */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-50 pb-2">Penanggung Jawab</h4>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-lg font-black text-gray-600 shrink-0 shadow-sm">
                    {booking.handledBy?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Ditangani Oleh</p>
                    <p className="text-base font-bold text-gray-900">{booking.handledBy?.name || "Unassigned"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS TAB */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6 items-start", activeTab !== "progress" && "hidden")}>
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
                <div className="grid grid-cols-5 gap-2">
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
                        <div className={\`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all \${
                          isCompleted
                            ? \`\${color.bg} \${color.border}\`
                            : isCurrent
                            ? \`bg-white \${color.border} ring-4 \${color.ring}\`
                            : "bg-white border-gray-200"
                        }\`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : (
                            <span className={\`text-xs font-black \${isCurrent ? color.text : "text-gray-300"}\`}>{index + 1}</span>
                          )}
                        </div>
                        <span className={\`text-[10px] font-bold leading-none text-center \${
                          isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                        }\`}>
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
              {(currentStepIndex >= 2 && !isCancelled) && (
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
                          href={photoLinkValue.startsWith('http') ? photoLinkValue : \`https://\${photoLinkValue}\`}
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
                      handleUpdatePhotoLink()
                      handleUpdateStatus("PHOTOS_DELIVERED")
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
                          <div className={\`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all \${
                            isCompleted
                              ? \`\${color.bg} \${color.border}\`
                              : isCurrent
                              ? \`bg-white \${color.border} ring-4 \${color.ring}\`
                              : "bg-white border-gray-200"
                          }\`}>
                            {isCompleted ? (
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            ) : (
                              <span className={\`text-[10px] font-black \${isCurrent ? color.text : "text-gray-300"}\`}>{idx + 1}</span>
                            )}
                          </div>
                          <span className={\`text-[9px] font-bold uppercase tracking-wide leading-none text-center \${
                            isCurrent ? color.text : isCompleted ? "text-gray-600" : "text-gray-300"
                          }\`}>
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

        {/* PRICING TAB */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6 items-start", activeTab !== "pricing" && "hidden")}>
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
                      <div key={idx} className="flex items-center justify-between py-3 border border-gray-100 bg-gray-50 rounded-xl px-4 group hover:border-gray-200 transition-colors">
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

      </div>

      <div className="hidden">`;

newFile = newFile.substring(0, startIndex) + replacement + newFile.substring(endIndex);

fs.writeFileSync('src/app/dashboard/bookings/[id]/page.tsx', newFile);
console.log("DONE!");
