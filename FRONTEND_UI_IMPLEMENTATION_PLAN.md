# Murni-Booth — Frontend UI Implementation Plan

## 1. Objective

Tahap development saat ini difokuskan pada penyelesaian **Frontend UI/UX dan user flow** Murni-Booth.

Backend ERPNext/API **BELUM menjadi dependency** pada tahap ini.

Semua data/API yang belum tersedia harus menggunakan **mock data** yang terisolasi di service layer.

Tujuan akhir tahap ini:

> Aplikasi Murni-Booth dapat didemokan dari Login → Order → Picking → Success dan DINE_IN → Customer Pickup → Success menggunakan mock data, tanpa membutuhkan backend ERPNext.

---

# 2. Development Strategy

Gunakan architecture berikut:

```text
Pages / Components
        ↓
Context / Hooks
        ↓
Service Layer
        ↓
Mock Data / Mock Service
```

Nanti setelah backend API siap:

```text
Pages / Components
        ↓
Context / Hooks
        ↓
Service Layer
        ↓
Real ERPNext API
```

## Important

Jangan membuat component melakukan fetch API ERPNext secara langsung.

Semua komunikasi data harus melewati:

```text
src/api/
src/services/
src/context/
```

sesuai architecture project yang sudah ada.

---

# 3. Backend Status

Untuk tahap ini:

```text
Backend API: PENDING
Frontend API Integration: DISABLED / MOCK
ERPNext Contract: NOT READY
```

Jangan menebak:

* endpoint
* field ERPNext
* payload
* response
* QR format
* authentication behavior
* picked quantity API
* pickup API

Jika frontend membutuhkan data tersebut, gunakan mock data.

---

# 4. Existing Project Context

Pertahankan stack yang sudah digunakan:

* React
* Vite
* Vanilla CSS
* Mobile-first
* Bahasa UI: Indonesia
* Codebase: English
* Premium / modern / vibrant visual direction
* Responsive
* Existing project structure
* Existing routing
* Existing Context architecture

Jangan mengganti framework.

Jangan menambahkan UI framework baru.

Jangan mengganti Vanilla CSS menjadi Tailwind atau library CSS lain.

---

# 5. Existing Flow

Frontend harus mempertahankan flow utama:

```text
LOGIN
  ↓
HOME / ORDER LIST
  ↓
ORDER / PICKING
  ↓
┌───────────────────────────┐
│                           │
│ STATION_PICKUP            │
│ → SUCCESS                 │
│                           │
│ DINE_IN                   │
│ → CUSTOMER PICKUP         │
│ → SUCCESS                 │
│                           │
└───────────────────────────┘
```

---

# 6. Mock Data Strategy

Buat atau rapikan mock data agar semua halaman dapat berjalan tanpa backend.

Mock data harus menggambarkan kondisi nyata.

Minimal sediakan:

## User

```js
{
  name: "Demo Operator",
  email: "operator@murni.test"
}
```

## Orders

Minimal 3 order:

### Order 1 — STATION_PICKUP

```text
Order:
MOCK-DN-001

Type:
STATION_PICKUP

Status:
Ready for Picking
```

Dengan beberapa item.

### Order 2 — DINE_IN

```text
Order:
MOCK-DN-002

Type:
DINE_IN

Status:
Ready for Picking
```

Dengan beberapa item.

### Order 3 — Mixed / Edge Case

Sediakan satu order tambahan untuk menguji:

* multiple items
* quantity berbeda
* search
* partial picking
* completed picking

---

# 7. Login UI

Pastikan halaman Login sudah memiliki:

* Username/email input
* Password input
* Show/hide password jika sudah tersedia
* Login button
* Loading state
* Error state
* Disabled state ketika submitting
* Responsive layout
* Visual hierarchy yang jelas

Untuk sementara login menggunakan mock authentication.

Contoh:

```text
Username:
demo

Password:
demo
```

atau credential mock yang sudah digunakan project.

## Important

Jangan menghapus struktur auth yang sudah dibuat.

Mock authentication harus tetap melalui auth/service layer sehingga nanti mudah diganti dengan API ERPNext.

---

# 8. Home / Order List

Pastikan halaman Home dapat menampilkan mock orders.

Minimal informasi:

* Order number
* Customer/order identifier
* Order type
* Status
* Item count
* CTA untuk membuka order

## Order Type

Gunakan:

```text
DINE_IN
STATION_PICKUP
```

UI harus menampilkan label Bahasa Indonesia.

Contoh:

```text
DINE_IN
Makan di Tempat

STATION_PICKUP
Ambil di Booth
```

Jangan menampilkan technical enum jika tidak diperlukan user.

---

# 9. Order Search

Pastikan user dapat mencari order.

Search harus dapat bekerja menggunakan mock data.

Minimal search berdasarkan:

* Order number
* Customer
* Product name
* Product code jika tersedia

Search harus:

* case-insensitive
* tidak memanggil backend
* memiliki empty state
* memiliki clear search behavior

---

# 10. Order Detail / Picking

Picking adalah salah satu flow utama.

Pastikan UI dapat menampilkan:

* Order information
* Order type
* Customer/order identifier
* List item
* Product name
* Product code jika ada
* Ordered quantity
* Picked quantity
* Remaining quantity
* Quantity controls
* Completion button

---

# 11. Picking Quantity Interaction

Gunakan mock state untuk simulasi picked quantity.

Rules:

```text
picked quantity >= 0
picked quantity <= ordered quantity
```

Tidak boleh:

```text
picked quantity < 0
picked quantity > ordered quantity
```

User harus dapat:

* increment
* decrement
* reset jika UI membutuhkan
* melihat quantity secara jelas

Jika semua item sudah memenuhi quantity yang diperlukan, tombol completion dapat digunakan.

---

# 12. Picking Validation

Sebelum completion:

Validasi:

```text
Tidak ada item yang invalid.
Tidak ada picked quantity negatif.
Tidak ada picked quantity melebihi ordered quantity.
```

Jika belum lengkap, UI harus memberikan feedback yang jelas.

Jangan membuat backend validation palsu.

Ini hanya validation UI/mock.

---

# 13. Picking Completion

Ketika operator menekan:

```text
Selesai Picking
```

gunakan mock service.

Contoh:

```text
mockPickingService.completePicking(order)
```

Jangan langsung melakukan fetch ke ERPNext.

Simulasikan loading:

```text
Menyimpan...
```

Kemudian:

```text
Success
```

atau error mock jika diperlukan.

---

# 14. Routing

Pastikan flow berikut tetap benar:

```text
STATION_PICKUP
        ↓
/success
```

dan:

```text
DINE_IN
        ↓
/pickup
```

Jangan membalik flow tersebut.

---

# 15. Customer Pickup Page

Halaman `/pickup` harus dapat didemokan tanpa backend.

Minimal memiliki:

* QR scanner UI
* Manual input fallback
* Order lookup state
* Order information
* Pickup confirmation
* Loading state
* Error state
* Already picked-up state

---

# 16. QR Scanner UI

Untuk tahap frontend:

**Tidak perlu backend QR API.**

Jika scanner library sudah tersedia dan berfungsi, pertahankan.

Jika belum tersedia:

buat UI scanner yang dapat didemokan menggunakan mock QR input.

Contoh:

```text
MURNI-PICKUP:MOCK-SINV-001
```

Jangan mengunci parser berdasarkan contract backend final.

Buat QR parsing cukup terisolasi agar mudah diganti nanti.

---

# 17. Manual Pickup Input

Sediakan fallback input untuk testing.

Contoh:

```text
Masukkan kode pickup
```

Mock value:

```text
MURNI-PICKUP:MOCK-SINV-001
```

Ketika submit:

```text
mockPickupService.findOrder(code)
```

---

# 18. Pickup Order Result

Setelah QR/mock code valid, tampilkan:

* Order number
* Customer
* Items
* Quantity
* Total jika tersedia
* Pickup status

CTA:

```text
Konfirmasi Pickup
```

---

# 19. Pickup Confirmation

Gunakan mock service:

```text
mockPickupService.confirmPickup(order)
```

Simulasikan:

```text
Loading
↓
Success
```

Jangan menggunakan:

```text
PUT /api/resource/Sales Invoice/...
```

atau endpoint backend lainnya pada tahap ini.

---

# 20. Already Picked State

Buat mock scenario untuk order yang sudah diambil.

Contoh:

```text
MOCK-SINV-002
```

UI harus menampilkan state yang jelas:

```text
Pesanan sudah diambil
```

dan mencegah pickup kedua.

---

# 21. Success Screen

Pastikan Success Screen dapat digunakan oleh dua flow:

### Station Pickup

```text
Picking selesai
↓
Success
```

### Dine In

```text
Picking selesai
↓
Customer Pickup
↓
Pickup confirmed
↓
Success
```

Success screen harus memiliki:

* success indicator
* title
* short confirmation message
* order identifier jika tersedia
* CTA kembali ke Home
* reset state yang benar

---

# 22. Loading States

Semua async/mock operations harus memiliki loading state.

Minimal:

## Login

```text
Memproses login...
```

## Get Orders

```text
Memuat pesanan...
```

## Picking

```text
Menyimpan picking...
```

## Pickup Lookup

```text
Mencari pesanan...
```

## Pickup Confirmation

```text
Mengonfirmasi pickup...
```

Jangan membuat user menekan tombol berulang ketika proses sedang berjalan.

---

# 23. Error States

Semua flow utama harus memiliki error state.

Minimal:

```text
Login gagal
Order gagal dimuat
Picking gagal disimpan
QR tidak valid
Pesanan tidak ditemukan
Pickup gagal
```

Gunakan Bahasa Indonesia.

Error UI harus memberikan action yang jelas jika memungkinkan:

```text
Coba lagi
```

atau:

```text
Kembali
```

---

# 24. Empty States

Pastikan tersedia empty state untuk:

* Tidak ada order
* Search tidak menemukan order
* Pickup order tidak ditemukan

Contoh:

```text
Belum ada pesanan
```

atau:

```text
Pesanan tidak ditemukan
```

---

# 25. Responsive Design

Prioritas:

```text
Mobile
↓
Tablet
↓
Desktop
```

Target utama adalah perangkat mobile karena aplikasi digunakan sebagai booth/operator application.

Pastikan:

* button mudah disentuh
* quantity control mudah digunakan
* text tidak overflow
* card tidak terlalu padat
* scanner area cukup besar
* navigation mudah digunakan
* loading/error tidak merusak layout

---

# 26. UI Consistency

Pastikan seluruh halaman menggunakan visual system yang konsisten.

Perhatikan:

* typography
* spacing
* border radius
* buttons
* cards
* inputs
* status badges
* error messages
* loading indicators
* icons

Jangan membuat setiap halaman memiliki design language sendiri.

---

# 27. Mock Service Architecture

Jika belum tersedia, buat service mock yang terisolasi.

Contoh:

```text
src/services/mock/
```

atau struktur yang paling sesuai dengan architecture project saat ini.

Minimal:

```text
mockAuthService
mockOrderService
mockPickingService
mockPickupService
```

Tidak wajib menggunakan nama persis di atas jika architecture project saat ini memiliki convention berbeda.

Yang penting:

> UI tidak mengetahui apakah data berasal dari mock atau API.

---

# 28. API Replacement Strategy

Mock service harus dibuat sedemikian rupa sehingga nanti dapat diganti dengan real service.

Contoh:

```text
Current:

OrderContext
    ↓
orderService
    ↓
mockOrderService
```

Future:

```text
OrderContext
    ↓
orderService
    ↓
erpNextOrderService
```

Jangan membuat:

```text
Component
    ↓
fetch(...)
    ↓
ERPNext
```

di banyak tempat.

---

# 29. Do NOT Implement Yet

Pada tahap ini **JANGAN** melakukan:

* Backend API integration
* ERPNext field mapping final
* Backend contract alignment
* Real picking API
* Real pickup API
* Real QR backend validation
* CORS configuration
* Production authentication integration
* Backend business logic assumptions

Semua itu akan dilakukan setelah `BACKEND_CONTRACT.md` tersedia.

---

# 30. Do NOT Guess Backend

Jangan menganggap field berikut benar hanya karena pernah disebut sebelumnya:

```text
custom_order_type
picked_qty
custom_picked_up
```

Jangan menganggap endpoint berikut final:

```text
/api/resource/Delivery Note
/api/resource/Sales Invoice
```

Jangan menganggap format QR berikut final:

```text
MURNI-PICKUP:INVOICE_NAME
```

Gunakan mock data untuk sementara.

---

# 31. Existing Code Preservation

Sebelum coding:

1. Baca `PROJECT.md`.
2. Baca `IMPLEMENTATION_PLAN.md`.
3. Baca `IMPLEMENTATION_AUDIT_FIX_PLAN.md`.
4. Baca `IMPLEMENTATION_REVIEW_PLAN.md`.
5. Baca `BACKEND_CONTRACT_VERIFICATION_PLAN.md`.
6. Review source code yang sudah ada.

Jangan menghapus feature yang sudah bekerja.

Jangan melakukan broad refactor.

Jika diperlukan perubahan architecture, jelaskan alasannya terlebih dahulu dalam report.

---

# 32. Implementation Priority

Kerjakan dengan urutan:

## P0 — Core Flow

1. Mock data
2. Login flow
3. Home/order list
4. Order detail
5. Picking interaction
6. Picking completion
7. Routing
8. Success screen

## P1 — Customer Pickup

9. Pickup page
10. Mock QR/manual input
11. Pickup order lookup
12. Pickup confirmation
13. Already picked state
14. Success flow

## P2 — UX Polish

15. Loading states
16. Error states
17. Empty states
18. Responsive improvements
19. Visual consistency
20. Accessibility improvements

## P3 — Cleanup

21. ESLint warnings
22. Unused imports
23. Fast Refresh issues
24. Small technical debt
25. Code cleanup

---

# 33. Testing

Setelah implementasi:

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

Jika test tersedia:

```bash
npm test
```

---

# 34. Manual Flow Testing

Test seluruh flow menggunakan mock data.

## Flow A — Station Pickup

```text
Login
↓
Home
↓
Open STATION_PICKUP order
↓
Picking
↓
Set quantities
↓
Selesai Picking
↓
Success
↓
Back to Home
```

## Flow B — Dine In

```text
Login
↓
Home
↓
Open DINE_IN order
↓
Picking
↓
Set quantities
↓
Selesai Picking
↓
Customer Pickup
↓
Scan/mock QR
↓
Order ditemukan
↓
Konfirmasi Pickup
↓
Success
↓
Back to Home
```

## Flow C — Invalid Pickup

```text
Pickup
↓
Invalid QR/code
↓
Error
↓
Try Again
```

## Flow D — Already Picked

```text
Pickup
↓
Already picked order
↓
Already Picked State
```

---

# 35. Acceptance Criteria

Implementation dianggap selesai apabila:

* [ ] Login dapat didemokan tanpa backend.
* [ ] Home dapat menampilkan mock orders.
* [ ] Order search bekerja.
* [ ] Order detail bekerja.
* [ ] Picking quantity bekerja.
* [ ] Quantity tidak dapat melebihi ordered quantity.
* [ ] Quantity tidak dapat negatif.
* [ ] Picking completion bekerja dengan mock service.
* [ ] STATION_PICKUP menuju Success.
* [ ] DINE_IN menuju Customer Pickup.
* [ ] Customer Pickup dapat menggunakan mock QR/manual input.
* [ ] Pickup order dapat ditemukan menggunakan mock service.
* [ ] Pickup confirmation bekerja menggunakan mock service.
* [ ] Already picked state tersedia.
* [ ] Success screen bekerja.
* [ ] Loading state tersedia.
* [ ] Error state tersedia.
* [ ] Empty state tersedia.
* [ ] Responsive mobile bekerja.
* [ ] Tidak ada dependency terhadap backend ERPNext.
* [ ] Mock service terisolasi.
* [ ] `npm run build` berhasil.
* [ ] `npm run lint` berhasil atau warning yang tersisa dilaporkan.

---

# 36. Required Final Report From Gemini 1

Setelah selesai coding, buat report dengan format:

## 1. Executive Summary

Ringkasan perubahan.

## 2. Implemented

Daftar feature yang selesai.

## 3. Mock Services

Daftar mock service yang dibuat/diubah.

## 4. Files Changed

```text
File:
Change:
Reason:
```

## 5. User Flow Verification

### Station Pickup

```text
PASS / FAIL
```

### Dine In

```text
PASS / FAIL
```

### Customer Pickup

```text
PASS / FAIL
```

### Error States

```text
PASS / FAIL
```

### Responsive

```text
PASS / FAIL
```

## 6. Build

```text
npm run build

Result:
[ISI HASIL]
```

## 7. Lint

```text
npm run lint

Result:
[ISI HASIL]
```

## 8. Remaining Issues

Daftar issue yang belum selesai.

## 9. Backend Dependency

Tuliskan bagian yang masih menunggu backend API.

---

# 37. IMPORTANT FINAL INSTRUCTION

**Implementasikan frontend/UI sekarang menggunakan mock data.**

Backend API **PENDING**.

Jangan menunggu `BACKEND_CONTRACT.md`.

Jangan membuat API ERPNext berdasarkan asumsi.

Jangan melakukan backend integration.

Fokus pada:

> **UI + UX + Interaction + Mock Flow + Responsive + Clean Architecture**

Setelah implementasi selesai, berikan **Implementation Report** sesuai format di atas.

Jangan membuat perubahan tambahan di luar scope plan ini tanpa menjelaskannya di report.
