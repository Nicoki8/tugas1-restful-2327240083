# Tugas 1 RESTful API Murni dengan Express.js - Salon

- **Nama:** Nico Ramadhan Wijaya
- **NIM:** 2327240083
- **Kelas:** SI5B
- **Nomor Topik:** 4
- **Topik:** Salon
- **Link Vercel:** (isikan link deploy Vercel Anda di sini)

## Cara Menjalankan Secara Lokal
1. Pastikan Node.js sudah terinstal.
2. Buka terminal pada folder project, lalu jalankan perintah `npm install` untuk menginstal dependensi.
3. Jalankan server lokal menggunakan perintah `npm run dev` (development dengan nodemon) atau `npm start`.
4. Akses melalui browser atau Postman di `http://localhost:3000`.

## Daftar Endpoint
- `GET /` : Informasi API
- `GET /salon-services` : Mengambil semua data layanan salon
- `GET /salon-services/:id` : Mengambil satu data berdasarkan ID
- `GET /salon-services?kategori=rambut` : Filter data berdasarkan kategori
- `POST /salon-services` : Menambahkan data layanan baru
- `PUT /salon-services/:id` : Mengubah seluruh data layanan berdasarkan ID
- `DELETE /salon-services/:id` : Menghapus data layanan berdasarkan ID
```[cite: 1]