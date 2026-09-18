# IMPLEMENTATION AUDIT: PICKING & PICKUP FLOW

## 1. API Existing & Penggunaan Saat Ini

### Delivery Note API (`src/api/deliveryNote.js`)
- `getDeliveryNotes`: Mengambil list DN. Saat ini menggunakan endpoint custom (`VITE_API_SALES_ORDER_ENDPOINT`).
- `createDeliveryNoteFromSalesOrder`: Membuat DN dari SO. Menggunakan endpoint custom.
- `submitDeliveryNotePicking`: Saat ini dipanggil ketika **Picking Selesai**. Mengirim payload berisi `items`, `picked_by`, dan `custom_picked_by` ke `VITE_API_DELIVERY_NOTE_ENDPOINT`.
- `getDeliveryNoteHistory` & `getDeliveryNoteDetail`: Menggunakan standard Frappe API (`/api/resource/Delivery Note`).

### Pickup API (`src/services/pickupService.js`)
- `validatePickupQr`: Saat ini mencari **Sales Order** berdasarkan pickup code (`getSalesOrderByPickupCode`).
- `confirmPickup`: Saat ini mencari **Sales Invoice** berdasarkan pickup code dan melakukan update `custom_picked_up = 1` pada Sales Invoice.

## 2. Field Existing & State Management

### Context (`src/context/OrderContext.jsx`)
- `orders`: Menyimpan data Pending SO.
- `deliveryNotes`: Menyimpan data DN. Saat mapping, item ditambahkan properti lokal `pickedQty: 0` dan `orderedQty: i.qty`. **Belum ada** field `is_picked` boolean secara eksplisit di item.
- **`picked_by`**: Hanya dikirim saat submit picking. Belum digunakan untuk "lock" DN saat mulai picking.
- **DN Status**: Belum secara ketat difilter berdasarkan status "Draft" vs "Submitted" pada UI Home untuk list picking.
- **Pickup Number**: Disimpan sebagai `customPickUpCode` pada order context.

## 3. Flow Existing yang Perlu Dipertahankan
- Scanning barcode menggunakan kamera (`html5-qrcode`).
- Mekanisme increment/decrement quantity pada halaman Picking secara UI.
- Feedback visual saat scan barang (suara beep, toast).
- Halaman `Success` untuk menampilkan kode pickup setelah selesai.
- Search manual barcode di Picking dan input manual Pickup Code.
- Tampilan UI `CustomerPickup.jsx` yang memiliki state machine (idle, scanning, processing, dll).

## 4. Flow Existing yang Harus Diubah (Sesuai Requirement Baru)

### A. Picking Claim / Lock (BARU)
- **Current**: Klik "Mulai Picking" langsung masuk halaman `Picking.jsx`.
- **Target**: Klik "Mulai Picking" harus melakukan API call `frappe.client.set_value` untuk set `picked_by = current_user` dan SAVE ke server terlebih dahulu.

### B. List Delivery Note (Home)
- **Current**: Hanya ada satu list "Siap Picking" yang berisi semua DN.
- **Target**: Dibagi menjadi dua:
  1. **Available Picking**: `picked_by IS EMPTY` AND `is_picked != true` AND `docstatus == 0` (Draft)
  2. **Active Picking**: `picked_by == current_user` AND `is_picked != true` AND `docstatus == 0`

### C. Role Separation & Submit DN
- **Current**: Flow "Picking" yang mengirimkan data ke backend diasumsikan melakukan finalisasi (entah itu submit atau sekedar save item). Flow "Pickup" melakukan konfirmasi di tingkat *Sales Invoice*.
- **Target**: 
  - **Picking**: Hanya set `item.is_picked = true` per scan, dan `DN.is_picked = true` saat semua item selesai. **Tidak boleh melakukan Submit DN**. Hanya di-save dalam status Draft.
  - **Pickup**: Validasi menggunakan status `DN.is_picked == true`, dan saat `Confirm Pickup` ditekan, frontend melakukan **SUBMIT Delivery Note**.

### D. Duplicate / Wrong Scan (Picking)
- **Current**: Menggunakan kuantitas (`pickedQty` vs `orderedQty`).
- **Target**: Harus ketat terhadap `item.is_picked`. Jika scan berulang untuk item yang sama (asumsi qty 1, atau qty tercapai), harus menolak dan memunculkan "ITEM SUDAH DI-PICK".

## 5. Strategi API Baru / Perubahan API

### Frappe Standard API yang bisa digunakan
- `frappe.client.set_value`:
  - Untuk Claim: Set `picked_by` di DN.
  - Untuk Update Item: Set `is_picked` pada item (atau update item detail).
  - Untuk Complete Picking: Set `is_picked = 1` pada DN.
- `frappe.client.submit`:
  - Untuk Pickup Confirm: Melakukan submit pada doc Delivery Note.
- `frappe.client.get_list` & `frappe.client.get`:
  - Untuk mem-fetch data terbaru DN (state validation sebelum submit).

### API Custom
Jika `VITE_API_DELIVERY_NOTE_ENDPOINT` memang diperlukan (misal karena ada trigger backend khusus saat selesai picking), kita perlu menyesuaikan apakah API ini melakukan *Save* saja atau *Submit*. Sesuai aturan **#21 (PICKING TIDAK BOLEH SUBMIT DN)**, jika custom API ini melakukan submit, maka kita harus memindahkannya ke flow Pickup, dan Picking murni menggunakan Frappe Standard API untuk melakukan `Save` (Draft).
