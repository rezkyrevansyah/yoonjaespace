Arsitektur 2 Sisi
Betul, ada 2 sisi yang terpisah:
Sisi A — Management Dashboard (app.yoonjaespace.com atau yoonjaespace.vercel.app). Ini diakses oleh Owner, Admin, dan Photographer. Login required. Menu tampil sesuai role.
Sisi B — Client Status Page (public, tanpa login). Ini yang dilihat customer. Untuk handle banyak customer, konsepnya sederhana: setiap order punya unique Order ID yang di-generate otomatis (misalnya YJS-20260215-001). Dari Order ID ini, sistem generate unique URL seperti yoonjaespace.vercel.app/status/YJS-20260215-001. Jadi setiap customer punya link unik masing-masing. Admin tinggal copy link ini dan kirim ke customer via WA. Mau 10 customer atau 10.000 customer, sistemnya sama — satu URL per order, data ditarik dari database berdasarkan Order ID. Customer tidak perlu login, tidak perlu register. Mereka cukup buka link yang dikirim admin.

Flow Lengkap: Booking Sampai Selesai
Tahap 1 — Booking Masuk
Yang terjadi: Customer chat via WhatsApp, tanya ketersediaan dan mau booking.
Staff (Admin) di halaman: Dashboard → klik "New Booking"
Yang admin isi di form booking:
Nama client, nomor WA, email (opsional), tanggal & jam sesi, package yang dipilih (Birthday Smash Cake, Graduation, Family, dll), jumlah orang, durasi, add-ons awal (kalau sudah tahu — misal MUA, extra person, extra durasi), background yang diminta, photo for (kategori seperti 1st Birthday, Graduation, dll), BTS (yes/no), notes dari customer, dan field "Handled by" yang otomatis terisi nama admin yang login (ini untuk tracking komisi nanti).
Yang terjadi setelah submit: Order tercatat dengan status "Booked", muncul di calendar dashboard, sistem generate unique Order ID dan unique client status URL. Admin copy link status ini, kirim ke customer via WA beserta detail konfirmasi booking.
Customer di halaman: Belum buka apa-apa, masih di WA. Setelah dapat link, bisa buka halaman status yang menampilkan: logo Yoonjaespace, Order ID, nama mereka, status "Booked", detail booking (tanggal, jam, package), dan info studio (alamat, jam operasional, Instagram).

Tahap 2 — Pembayaran
Yang terjadi: Customer transfer pembayaran (di luar sistem, via bank transfer).
Staff (Admin) di halaman: Dashboard → cari order (via search atau klik dari calendar) → buka detail order → klik "Mark as Paid"
Yang berubah: Status order jadi "Paid". Di halaman status client, status tracker otomatis update — customer bisa lihat real-time bahwa pembayaran sudah dikonfirmasi.

Tahap 3 — Hari H Sesi Foto
Sebelum sesi:
Admin buka dashboard, lihat "Today's Schedule" — daftar semua sesi hari ini (mirip Reminder di Notion mereka sekarang). Ada tombol "Send Reminder" di setiap booking, yang generate wa.me link dengan auto-text seperti: "Halo [Nama], reminder untuk sesi foto kamu hari ini jam [Jam] di Yoonjaespace. Ditunggu ya!"
Photographer di halaman: Login dengan role Photographer → hanya lihat jadwal hari ini dan detail order yang relevan (nama client, package, jumlah orang, background, notes, add-ons). Photographer tidak bisa edit data atau lihat finance.
Saat/setelah sesi:
Admin bisa tambah add-ons yang muncul saat sesi (misalnya client minta extra durasi atau tambah orang). Ini masuk ke halaman detail order → section "Add-ons" → klik "Add Item" → isi nama item, qty, harga. Total order otomatis recalculate.
Setelah sesi selesai: Admin klik "Mark as Shoot Done". Status jadi "Shoot Done". Customer lihat update di halaman status mereka.

Tahap 4 — Kirim Foto
Yang terjadi: Tim edit foto, upload ke Google Drive, dapat link sharing.
Staff (Admin) di halaman: Detail order → section "Photo Delivery" → paste link Google Drive.
Yang berubah: Admin klik "Mark as Photos Delivered". Status jadi "Photos Delivered". Di halaman status client, sekarang muncul tombol "View Your Photos" yang mengarah ke link Google Drive tersebut. Ini momen paling exciting buat customer.

Tahap 5 — Percabangan
Kalau TIDAK ada cetak/canvas: Admin klik "Close Order". Status jadi "Closed". Selesai. Di halaman status client muncul ucapan terima kasih dan tombol "Book Again" (link ke WA).
Kalau ADA cetak/canvas: Masuk ke sub-flow print tracking:
5a. Waiting Client Selection — Customer pilih foto mana yang mau dicetak. Admin catat di detail order (bisa paste link atau notes). Status print: "Waiting Client Selection".
5b. Sent to Vendor — Admin kirim ke vendor cetak. Isi nama vendor (opsional) di detail order. Status print: "Sent to Vendor Print".
5c. Print Received — Hasil cetak diterima studio. Admin update status: "Print Received".
5d. Packaging — Tim packaging. Status: "Packaging".
5e. Shipped — Admin input nomor resi/tracking (opsional), update status: "Shipped to Client". Di halaman status client, muncul info tracking jika ada.
5f. Completed — Client terima. Admin close. Status: "Completed".
Semua perubahan status print ini juga terlihat real-time di halaman status customer.

Fitur Per Role
Owner (semua menu tampil)
Dashboard: ringkasan hari ini (jadwal, pending tasks, revenue hari ini), quick stats (total booking bulan ini, revenue bulan ini, pending orders).
Bookings/Orders: lihat semua, buat baru, edit, ubah status, hapus.
Calendar: monthly view dan daily view semua booking.
Clients: database semua client + history booking mereka.
Finance: income (otomatis dari order paid), expense (manual input), monthly summary, gross profit, export ke Excel.
Komisi/Bonus: lihat summary per staff — jumlah booking yang di-handle, total revenue, bisa set persentase atau nominal komisi, export ke Excel.
Invoice: generate invoice PDF per order (estetik, ada logo, warna aksen merah, itemized).
Settings: manage users (tambah/hapus staff, set role), manage packages (nama, harga, durasi, kapasitas), manage add-on templates, manage custom fields untuk form booking, set jam operasional & hari libur.
Export: semua data finance dan komisi bisa export .xlsx.
Admin
Dashboard: sama seperti owner tapi tanpa finance summary dan komisi.
Bookings/Orders: buat baru, edit, ubah status (ini main workflow mereka sehari-hari).
Calendar: lihat jadwal.
Clients: lihat dan edit data client.
Invoice: generate dan kirim.
Reminder: lihat daftar hari ini, klik send reminder (wa.me).
Tidak bisa akses: Finance, Komisi, Settings (user management & global settings).
Photographer
Today's Schedule: daftar sesi hari ini saja.
Order Detail: lihat detail order yang relevan (read-only — nama client, package, notes, background, jumlah orang).
Tidak bisa akses: semua menu lain.
Customer (halaman public, tanpa login)
Yang mereka lihat di status page:
Logo Yoonjaespace + branding, nama mereka + Order ID, visual status tracker (progress bar seperti di Otter), detail booking (tanggal, jam, package, add-ons), link foto Google Drive (muncul setelah Photos Delivered), tracking cetak/canvas (jika ada), info studio (jam buka, alamat), social icons (Instagram, WA, dll), dan tombol "Book Again".
Yang mereka TIDAK bisa lihat: harga/payment info (kecuali kamu mau tampilkan — ini bisa didiskusikan), data customer lain, apapun dari dashboard internal.

Tentang Custom Fields
Dari screenshot Notion input form, saya lihat ada field-field seperti Background, Photo for, Add on, BTS, Notes. Client kamu bilang mau bisa custom pertanyaan. Solusinya: di Settings ada menu "Custom Fields" di mana owner/admin bisa bikin field tambahan untuk form booking. Tipe field yang tersedia: text, dropdown (dengan opsi yang bisa di-set), checkbox, dan number. Field custom ini otomatis muncul di form booking dan di detail order.

Ada yang mau ditambah, diubah, atau diklarifikasi sebelum kita lanjut ke tahap design, Rev?pdfsaya sudah oke, tapi pastikan juga seluruh keinginan client di pdf ini terpenuhiFeb 15Oke Revan, saya cross-check ulang PDF brief dengan flow yang sudah kita diskusikan. Saya cek satu per satu supaya tidak ada yang terlewat:
Cross-Check PDF vs Rencana Kita

1. Purpose — ✅ Sudah tercakup. Tracking order & status, follow-up canvas & pengiriman, operasional harian lebih rapi. Semua ada di flow yang sudah kita bahas.
2. Payment — ✅ Sudah tercakup. No DP, full payment via transfer, no payment gateway, status Paid/Unpaid. Satu hal yang perlu saya tambahkan: "Default Paid (opsional)". Ini artinya di Settings, owner bisa set apakah order baru otomatis berstatus Paid atau Unpaid. Berguna kalau ada client yang bayar di tempat saat sesi, jadi admin tidak perlu manual mark as paid satu-satu. Ini belum saya sebut sebelumnya, sekarang sudah masuk.
3. Order Status — ✅ Semua status sudah tercakup di flow.
   Main status: Booked → Paid → Shoot Done → Photos Delivered → Closed.
   Print/canvas sub-status: Waiting Client Selection → Sent to Vendor Print → Printing In Progress (optional) → Print Received → Packaging → Shipped to Client → Completed.
   Yang perlu saya pastikan masuk: "Printing In Progress" sebagai status opsional. Di flow sebelumnya saya skip dari "Sent to Vendor" langsung ke "Print Received". Sekarang saya tambahkan "Printing In Progress" sebagai status opsional di antara keduanya — admin bisa skip atau pakai tergantung kebutuhan.
   4.1 Booking/Order — ✅ Sudah ada. Tapi saya pastikan semua field ini ada di form:
   Create & edit order ✅, Auto Booking ID ✅ (format YJS-YYYYMMDD-XXX), Schedule date & time ✅, Package ✅, Add-ons ✅, Discount/voucher — ini belum saya detail sebelumnya. Saya tambahkan: di form booking ada field discount yang bisa diisi nominal atau persentase, plus field kode voucher (text, manual input, tidak perlu sistem validasi voucher otomatis untuk MVP). Discount ini mengurangi total dan tampil di invoice sebagai line item terpisah. Notes ✅, Status tracking ✅.
   4.2 Add-ons (Flexible) — ✅ Sudah ada. Bisa ditambah after booking, during session, after session. Item-based dengan name, qty, unit price, subtotal. Auto total calculation. Semua sudah di flow.
   4.3 Client Database — ✅ Sudah ada. Yang perlu saya pastikan lengkap: data client (nama, WA, email), booking history (semua order dari client ini tampil di profil mereka), dan shipping address — ini belum saya sebut eksplisit. Sekarang di form client ada field alamat pengiriman yang muncul/relevan kalau order ada cetak canvas. Alamat ini tersimpan di profil client dan bisa di-reuse untuk order berikutnya.
   4.4 Delivery & Print — ✅ Sudah ada. Photo delivery link (Google Drive) ✅, Selected photo link/notes ✅ (untuk client pilih foto mana yang mau dicetak), Print vendor ✅ (field opsional di detail order), Shipping tracking/resi ✅ (field opsional, tampil di halaman status client jika diisi).
   4.5 Invoice — ✅ Sudah ada. Generate invoice PDF, itemized (package + add-ons – discount), download/print/share link. Invoice design estetik dengan logo Yoonjaespace dan aksen merah. Satu tambahan dari PDF: share link. Jadi selain download PDF, admin juga bisa generate link invoice yang bisa dikirim ke client via WA. Mirip konsep status page — unique URL per invoice.
   4.6 Dashboard — Saya cross-check detail:
   Today schedule ✅, Monthly schedule ✅ (calendar view), Orders section yang menampilkan: Waiting Client Selection ✅, Sent to Vendor ✅, Need Packaging ✅, Need Shipping ✅. Keempat ini saya jadikan task cards/widget di dashboard supaya admin langsung lihat apa yang perlu ditindaklanjuti hari ini. Search order by name/WA/ID ✅ — ini saya buat sebagai global search di top bar dashboard yang bisa cari berdasarkan nama client, nomor WA, atau Order ID.
4. Finance (Simple) — ✅ Sudah ada.
   Income otomatis dari paid orders ✅. Expense manual input dengan kategori: print vendor, packaging, shipping, operational ✅. Optional link to order — ini belum saya sebut sebelumnya. Artinya saat admin input expense, ada field opsional untuk mengaitkan expense tersebut ke order tertentu. Misalnya biaya cetak canvas Rp150.000 bisa di-link ke order YJS-20260215-001. Ini berguna untuk tracking cost per order. Sekarang sudah masuk.
   Summary: monthly income, monthly expense, gross profit ✅. Export ke Excel ✅.
5. Users & Roles — ✅ Sudah ada. Admin (full access), Photographer (view schedule & order detail). Yang dari PDF: Packaging/Delivery staff (optional) — view shipping tasks. Ini belum saya bahas sebelumnya. Saya tambahkan sebagai role ke-4 di sisi dashboard. Staff packaging/delivery hanya bisa lihat order yang statusnya di fase print & shipping (Print Received, Packaging, Shipped). Mereka bisa update status di fase itu tapi tidak bisa akses menu lain.
   Jadi role finalnya: Owner (semua + finance + komisi + settings), Admin (operasional + booking + client + invoice), Photographer (jadwal hari ini + detail order read-only), Packaging/Delivery (shipping tasks only).
6. Integrations — ✅ Google Drive (link only, paste manual), WhatsApp (wa.me link, no API).
