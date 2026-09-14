# Murni-Booth Backend API Contract

> Dokumen ini mencatat contract API backend yang sudah ditemukan dari request/response aktual dan rencana integrasi Thunder Picking API.
>
> Status:
>
> * `CONFIRMED` = sudah terlihat dari cURL/response aktual
> * `UNKNOWN` = belum bisa dipastikan
> * `ASSUMED` = asumsi frontend, belum dikonfirmasi backend

---

## Thunder Picking API Integration

Murni Booth akan menggunakan Thunder Picking API sebagai backend/external service untuk kebutuhan:

* authentication
* sales order
* delivery note
* return
* upload delivery note photo

---

## 1. API Base Configuration

API menggunakan konfigurasi base URL:

```env
API_BASE_URL=https://dev.thunderlab.id
```

Value production harus berasal dari environment variable dan **jangan hardcode URL di application code**.

Daftar environment variable yang diperlukan:
```text
API_BASE_URL
API_LOGIN_ENDPOINT
API_FORGOT_PASSWORD_ENDPOINT
API_SALES_ORDER_ENDPOINT
API_DELIVERY_NOTE_ENDPOINT
API_PENDING_SALES_ORDERS_ENDPOINT
API_CREATE_DELIVERY_NOTE_FROM_SO_ENDPOINT
API_RETURNABLE_DELIVERY_NOTES_ENDPOINT
API_DELIVERY_NOTE_RETURN_ENDPOINT
API_UPLOAD_DN_PHOTO_ENDPOINT
```
Catatan: Terdapat typo pada dokumentasi lama `API_DELIVERY_NOTE_ENPOINT`. Akan dinormalkan menjadi `API_DELIVERY_NOTE_ENDPOINT`.

---

## 2. Authentication Contract

Login dilakukan melalui endpoint:

```http
POST API_LOGIN_ENDPOINT
Content-Type: application/json
```

Request:
```json
{
  "usr": "email_pengguna",
  "pwd": "password_pengguna"
}
```

Login menghasilkan session authentication melalui cookie:
```http
Set-Cookie: sid=<session_id>
```

Kemudian request authenticated harus mengirim:
```http
Cookie: sid=<session_id>
```

**Ketentuan Session:**
* Bagaimana session diperoleh: Session didapatkan dari response cookie HTTP saat login berhasil.
* Bagaimana session digunakan: Cookie `sid` dikirim pada request header (melalui konfigurasi credentials: true pada axios/fetch) untuk request berikutnya.
* Credential/password tidak boleh ditulis ke source code.
* `sid` adalah credential/session-sensitive value.
* **Jangan mencetak `sid` ke console/log.**
* **Jangan memasukkan `sid` ke dokumentasi sebagai value nyata.**
* Jika arsitektur project menggunakan backend proxy/session storage, session ini di-manage oleh proxy. **Jangan mengasumsikan frontend boleh langsung mengekspos `sid` ke browser sebelum implementasi backend ditentukan.**

---

## 3. Login Endpoint

### Request
```http
POST {API_BASE_URL}{API_LOGIN_ENDPOINT}
Content-Type: application/json
```

Body:
```json
{
  "usr": "string",
  "pwd": "string"
}
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

Catatan: Response harus menangani HTTP success, authentication failure, validation failure, dan server error.

---

## 4. Forgot Password Contract

### Request
```http
POST {API_BASE_URL}{API_FORGOT_PASSWORD_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Accept: application/json
Origin: {API_BASE_URL}
```

Body:
```json
{
  "user": "email_pengguna"
}
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 5. Update Password Contract

### Request
```http
POST /api/method/frappe.core.doctype.user.user.update_password
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Body:
```json
{
  "old_password": "string",
  "new_password": "string",
  "logout_all_sessions": 0
}
```
*Endpoint ini membutuhkan authenticated session.*

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 6. Sales Order API

### Request
```http
GET {API_BASE_URL}{API_SALES_ORDER_ENDPOINT}
```

Authentication:
```http
Cookie: sid=<session_id>
```

Query parameters:
| Parameter   | Type    | Required | Default | Description        |
| ----------- | ------- | -------- | ------- | ------------------ |
| sales_order | string  | No       | -       | Search Sales Order |
| page        | integer | No       | 1       | Page number        |
| limit       | integer | No       | 20      | Number of records  |

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 7. Pending Sales Orders API

Kegunaannya untuk mendapatkan Sales Order yang masih pending.

### Request
```http
GET {API_BASE_URL}{API_PENDING_SALES_ORDERS_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Query:
```text
search_query
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 8. Create Delivery Note From Sales Order

Digunakan untuk membuat Delivery Note berdasarkan Sales Order.

### Request
```http
POST {API_BASE_URL}{API_CREATE_DELIVERY_NOTE_FROM_SO_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Body:
```json
{
  "sales_order": "nomor_sales_order"
}
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 9. Submit Delivery Note

### Request
```http
POST {API_BASE_URL}{API_DELIVERY_NOTE_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Body:
```json
{
  "name": "nomor_order",
  "items": [
    {
      "item_code": "kode_item_1",
      "qty": 10
    }
  ]
}
```

Field description:
| Field             | Type   | Description                    |
| ----------------- | ------ | ------------------------------ |
| name              | string | Delivery Note/order identifier |
| items             | array  | Items yang akan diproses       |
| items[].item_code | string | Item code                      |
| items[].qty       | number | Quantity                       |

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 10. Returnable Delivery Notes

### Request
```http
GET {API_BASE_URL}{API_RETURNABLE_DELIVERY_NOTES_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Query:
```text
search_query
page
limit
```
Default:
```text
page = 1
limit = 20
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 11. Submit Delivery Note Return

### Request
```http
POST {API_BASE_URL}{API_DELIVERY_NOTE_RETURN_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Body:
```json
{
  "name": "nomor_order_pengembalian",
  "items": [
    {
      "item_code": "kode_item_1",
      "qty": 5
    }
  ]
}
```

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 12. Upload Delivery Note Photo

### Request
```http
POST {API_BASE_URL}{API_UPLOAD_DN_PHOTO_ENDPOINT}
```

Headers:
```http
Content-Type: application/json
Cookie: sid=<session_id>
```

Body:
```json
{
  "dn_name": "nama_delivery_note",
  "filename": "nama_file.jpg",
  "filedata": "base64_encoded_data"
}
```

Ketentuan Upload:
* `filedata` berupa Base64
* filename harus dipertahankan
* request membutuhkan authenticated session
* jangan menyimpan foto/base64 secara permanen kecuali memang diperlukan
* ukuran file perlu divalidasi sebelum request
* Maximum upload size: TBD — confirm with Thunder Picking API.

### Response
Status: TBD

Response schema:
TBD — must be confirmed from actual Thunder Picking API response.

Example response:
Not available yet.

---

## 13. API Mapping to Murni Booth

| Murni Booth Feature  | Thunder API                   |
| -------------------- | ----------------------------- |
| Login                | Login endpoint                |
| Forgot Password      | Reset Password                |
| Change Password      | Update Password               |
| Search Sales Order   | Sales Order                   |
| Pending Sales Order  | Pending Sales Orders          |
| Create Delivery Note | Create DN from SO             |
| Submit Delivery Note | Submit DN                     |
| Return Delivery Note | Returnable DN + Submit Return |
| Upload DN Photo      | Upload DN Photo               |

---

## 14. API Error Handling

Expected handling contract untuk Murni Booth minimal menangani kategori:
```text
401 Unauthorized
403 Forbidden
404 Not Found
422 Validation Error
429 Rate Limited
500 Internal Server Error
502/503 External API Error
Network/Timeout Error
```
*(Catatan: Ini adalah expected handling, tidak mengklaim Thunder Picking pasti menggunakan seluruh status code tersebut.)*

Frontend **tidak boleh menampilkan raw error/API response secara langsung kepada operator**.

Contoh yang benar:
```text
API error:
"Invalid session"

UI:
"Session Anda sudah berakhir. Silakan login kembali."
```

---

## 15. Session Expiration

Jika authenticated API mengembalikan indikasi session expired/unauthorized:
1. Hapus/invalidasikan session lokal.
2. Jangan retry tanpa batas.
3. Arahkan user ke halaman login.
4. Tampilkan pesan yang jelas.

*(Jangan melakukan automatic infinite retry.)*

---

## 16. Security Rules

* Jangan hardcode username/password.
* Jangan hardcode `sid`.
* Jangan commit `.env`.
* Jangan log password.
* Jangan log session cookie.
* Jangan expose secret credential ke source code.
* Jangan menampilkan raw API error kepada operator.
* Validasi input sebelum request.
* Validasi quantity sebelum submit.
* Gunakan HTTPS untuk API production.
* Jangan menyimpan Base64 foto secara tidak perlu.
* Jangan menganggap data dari frontend sebagai trusted data.

---

## 17. Open Questions / TBD

1. Exact value setiap API endpoint.
2. Actual login response.
3. Actual response JSON untuk Sales Order.
4. Actual response JSON untuk Pending Sales Order.
5. Actual response JSON Create Delivery Note.
6. Actual response JSON Submit Delivery Note.
7. Actual response JSON Returnable Delivery Note.
8. Actual response JSON Submit Return.
9. Actual response JSON Upload Photo.
10. Exact HTTP status code/error response dari Thunder Picking.
11. Maximum photo upload size.
12. Session expiration behavior.
13. CORS requirement.
14. Apakah Murni Booth menggunakan backend proxy atau direct API access.

---

# Legacy Document (Initial API Observations)

Bagian di bawah ini adalah dokumen awal yang mencatat observasi terhadap request/response aktual (sebelum kontrak penuh ditetapkan). Tetap dipertahankan sebagai referensi.

## L.1 Authentication (Legacy)

### Endpoint
```text
POST https://dev.thunderlab.id/api/method/thunder_erp.api.auth.login_and_get_sid
```

### Confirmed Response Example
```json
{
  "message": [
    {
      "name": "MAT-DN-2026-00389",
      "customer": "Customer Shopee",
      "posting_date": "2026-08-13",
      "status": "Draft",
      "po_no": "260728T15JM9HS",
      "instructions": null,
      "against_sales_order": "SO-MGY-2607-00006-2",
      "custom_pickup_later": true,
      "items": [
        {
          "item_code": "SANDRO2",
          "item_name": "SANDRO2",
          "qty": 1.0,
          "warehouse": "Stores - MG",
          "against_sales_order": "SO-MGY-2607-00006-2"
        }
      ]
    }
  ]
}
```

## L.2 Fields Still Unknown (Legacy)

### Order Type
Frontend sebelumnya mengasumsikan: `custom_order_type` (DINE_IN, STATION_PICKUP). Belum ada bukti dari response aktual.

### Picked Quantity
Frontend sebelumnya mengasumsikan: `picked_qty`. Belum diketahui letak atau bentuk pastinya di response.
