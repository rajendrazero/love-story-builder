# Selamanya — Website for Kekasih

Template sinematik untuk menyusun dan menerbitkan cerita pasangan. Dibangun dengan Nuxt 4, Tailwind CSS, GSAP, Zod, Cloudflare Workers + D1, dan Cloudinary.

## Jalankan lokal

1. Pasang Node.js 22.22.3+, 24.15.0+, atau 26+ dan pnpm 10.33.0.
2. `pnpm install`
3. Buat database D1 Cloudflare: `pnpm exec wrangler d1 create kekasih-db`; salin ID hasilnya ke `wrangler.toml`.
4. Opsional: salin `.dev.vars.example` menjadi `.dev.vars` dan isi kredensial Cloudinary untuk mengaktifkan unggah foto. Tanpa env tersebut, preview dan backend cerita tetap berjalan; foto dapat ditambahkan melalui URL HTTPS.
5. Terapkan skema ke D1 lokal: `pnpm db:local`
6. Jalankan situs dengan binding Cloudflare lokal: `pnpm preview`

`pnpm dev` dapat digunakan untuk iterasi UI Nuxt, sedangkan preview berbasis Wrangler menjalankan binding D1 yang dipakai API. Jalankan pemeriksaan tipe dengan `pnpm typecheck`.
Jalankan pengujian unit dengan `pnpm test`.

Galeri dan foto yang dipilih di studio diunggah langsung ke Cloudinary menggunakan tanda tangan yang dibuat backend. Untuk unggah foto, isi ketiga variabel Cloudinary; jika `.env` dan `.dev.vars` sama-sama dipakai, pastikan keduanya berisi kredensial akun yang sama. URL gambar HTTPS juga bisa dimasukkan langsung. Contoh hasil bisa dilihat tanpa mengisi form di `/preview`.

## Siapkan Cloudflare

1. Jika belum dibuat, buat database D1: `pnpm exec wrangler d1 create kekasih-db`, lalu salin `database_id` hasilnya ke `wrangler.toml`.
2. Terapkan skema: `pnpm db:remote`.
3. API cerita menggunakan database D1 melalui binding `DB`, yang sudah diatur di `wrangler.toml`.
4. Isi `CLOUDINARY_CLOUD_NAME` pada `[vars]` di `wrangler.toml`. Simpan kredensial privat dengan `pnpm exec wrangler secret put CLOUDINARY_API_KEY` dan `pnpm exec wrangler secret put CLOUDINARY_API_SECRET`. Wrangler meminta nilainya secara interaktif; jangan commit atau kirim secret lewat chat.
5. Deploy: `pnpm run deploy`.

Pastikan sudah login dengan `pnpm exec wrangler login`. Database `kekasih-db` sudah dikaitkan ke proyek ini. Kredensial API Cloudinary tidak pernah dikirim ke browser; hanya API key publik dan tanda tangan upload yang berumur pendek yang digunakan untuk unggahan.

## Fitur

- Halaman depan sinematik, navigasi sticky, animasi GSAP dengan ScrollTrigger, lifecycle cleanup, dukungan reduced motion, dan kursor responsif.
- Studio satu template untuk sampul, kartu ucapan, galeri, cerita pasangan, halaman buku, pesan penutup, lagu, dan sandi.
- Validasi payload di browser/API menggunakan skema Zod; foto diunggah ke Cloudinary.
- Publikasi cerita ke D1, tautan berbagi, kode QR, dan proteksi sandi PBKDF2.
- Halaman publik responsif dengan kartu, galeri bergerak, buku cerita, dan pemutar lagu opsional.
- Pratinjau template lengkap tersedia di `/preview` tanpa perlu mengisi atau mengubah form.

## Catatan

Sandi cerita dapat melindungi akses, tetapi tautan publik dan aset foto Cloudinary tetap dapat dibagikan ulang oleh penerima. Gunakan URL audio langsung untuk pemutar lagu. Domain khusus, aturan akses tambahan, pembatasan unggahan, dan moderasi konten dapat dikonfigurasi sesuai kebutuhan produksi.
