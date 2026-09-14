# Murni-Booth

## Project Specification & Source of Truth

**Project:** Murni-Booth  
**Company:** Bali Murni  
**Version:** 3.0  
**Status:** IMPLEMENTATION  
**Previous Version:** 2.1 — PROTOTYPE / UX UI DESIGN  
**Current Phase:** Production-oriented frontend implementation with ERPNext integration  
**UI Language:** Bahasa Indonesia  
**Code Language:** English  
**Primary Platform:** Mobile-first Web Application  
**Frontend:** React + Vite  
**Styling:** Vanilla CSS  

---

# 1. Project Overview

Murni-Booth adalah aplikasi operasional internal untuk staff Bali Murni yang digunakan untuk memproses pengambilan/picking produk retail dan skincare berdasarkan order pelanggan.

Aplikasi ini bukan aplikasi kitchen, food preparation, restaurant POS, atau menu management.

Fokus utama aplikasi:

- mencari order
- melihat detail order
- melakukan picking produk
- melakukan picking menggunakan barcode
- melakukan picking secara manual
- memastikan quantity tidak melebihi order
- menyelesaikan proses picking
- melakukan customer pickup untuk order yang membutuhkan pickup confirmation
- melakukan validasi QR pickup
- mengupdate status pickup pada Sales Invoice
- melanjutkan ke order berikutnya

---

# 2. Project History

Versi 2.1 merupakan prototype UX/UI.

Pada versi tersebut:

- backend belum digunakan
- API belum digunakan
- ERPNext belum diintegrasikan
- authentication masih mock
- order masih menggunakan mock data
- barcode masih disimulasikan
- QR pickup masih disimulasikan

Versi 3.0 mengubah project dari prototype menjadi implementation phase.

UX dan interaction model yang telah disetujui pada versi 2.1 tetap menjadi dasar.

Yang berubah terutama adalah:

- mock data → real ERPNext data
- mock authentication → real ERPNext authentication
- simulated pickup → real Sales Invoice update
- simulated order/picking → ERPNext Delivery Note data
- prototype-only architecture → production-oriented frontend architecture

---

# 3. Product Identity

Murni-Booth adalah aplikasi operasional.

Prioritas desain:

1. Clarity
2. Speed
3. Usability
4. Error prevention
5. Visual polish

Premium visual tidak boleh mengorbankan kecepatan operasional.

Aplikasi harus terasa:

- modern
- clean
- premium
- professional
- operational
- highly readable
- mobile-first

Hindari:

- dashboard yang terlalu dekoratif
- visual yang terlalu playful
- kitchen POS appearance
- food ordering appearance
- excessive animation
- unnecessary modal/dialog
- dense information overload

---

# 4. Primary User

Primary user adalah staff operasional Bali Murni.

Karakteristik penggunaan:

- penggunaan cepat
- banyak dilakukan dengan smartphone/tablet
- dapat dilakukan dengan satu tangan
- staff membutuhkan feedback yang jelas
- kesalahan picking harus diminimalkan
- navigasi harus seminimal mungkin

Setiap screen harus menjawab:

1. Saya sedang berada di mana?
2. Saya sedang melakukan apa?
3. Apa yang harus saya lakukan selanjutnya?

Setiap screen sebaiknya memiliki satu primary action.

---

# 5. UX Principles

## 5.1 Fast

Staff tidak boleh melakukan terlalu banyak langkah untuk operasi sederhana.

## 5.2 Simple

UI harus mudah dipahami tanpa training panjang.

## 5.3 Clear

Status dan quantity harus terlihat jelas.

## 5.4 Operational

Semua komponen harus memiliki alasan operasional.

## 5.5 Mobile-first

Touch target harus cukup besar.

## 5.6 Low cognitive load

Staff tidak perlu mengingat state aplikasi.

## 5.7 Error prevention

Aplikasi harus mencegah kesalahan sebelum terjadi.

## 5.8 Minimal navigation

Flow utama harus linear.

---

# 6. Order Types

Murni-Booth memiliki dua jenis order:

```text
DINE_IN
STATION_PICKUP