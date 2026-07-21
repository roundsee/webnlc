# GSJA New Life Template

Frontend website bergaya gereja modern dengan halaman admin lokal untuk mengganti dummy content.

## Fitur

- Beranda responsif dengan hero, about, pelayanan, agenda, media, dan kontak.
- Halaman admin di `/admin` untuk mengubah konten dummy.
- Menu `Renungan` di admin membuka HTML editor yang menyimpan data ke MySQL.
- Penyimpanan konten utama masih memakai `localStorage`, sedangkan renungan memakai backend API.

## Menjalankan

```bash
npm install
npm run dev
```

Untuk Renungan + MySQL, jalankan juga API-nya di terminal lain:

```bash
npm run dev:api
```

Database bisa dibuat dari `server/schema.sql` atau otomatis saat API start jika user MySQL punya izin `CREATE DATABASE`.

Default koneksi backend saat ini:

- DB_HOST=localhost
- DB_PORT=3306
- DB_USER=root
- DB_PASSWORD=test
- DB_NAME=db_nlc

Environment yang dipakai server:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (default `3001`)

## Catatan

- Gambar dan video masih berupa placeholder visual.
- Renungan sekarang sudah memakai backend MySQL, jadi publikasi bisa disimpan permanen.