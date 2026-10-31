# Selamanya — Website for Kekasih

Template sinematik untuk menyusun dan menerbitkan cerita pasangan. Dibangun dengan Nuxt 4, Tailwind CSS, GSAP, Zod, Cloudflare Workers + D1, dan Cloudinary.

## Jalankan lokal

1. Pasang Node.js 22.22.3+, 24.15.0+, atau 26+ dan pnpm 10.33.0.
2. `pnpm install`
3. Gunakan binding D1 yang sudah tercantum di `wrangler.toml`. `pnpm db:local` membuat/menyiapkan database lokal; jangan menjalankan `wrangler d1 create` atau `pnpm db:remote` untuk pengujian lokal.
4. Siapkan `.dev.vars` (file lokal ini diabaikan Git). `BETTER_AUTH_SECRET` harus berupa nilai acak minimal 32 karakter; `NUXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` boleh memakai pasangan test di `.dev.vars.example` hanya untuk localhost. Untuk menyelesaikan pendaftaran dan menerima email verifikasi/reset, isi `RESEND_API_KEY` serta `EMAIL_FROM` dengan akun/domain Resend milikmu. Foto menggunakan kredensial Cloudinary lokal.
5. Untuk HTTPS lokal, set `BETTER_AUTH_URL=https://localhost:8787` di `.dev.vars`. Jangan gunakan site key Turnstile production di localhost.
6. Terapkan skema D1 lokal: `pnpm db:local`.
7. Pasang `mkcert` di Windows (contoh: `winget install FiloSottile.mkcert`), buka terminal baru, lalu jalankan sekali:

   ```powershell
   mkcert -install
   New-Item -ItemType Directory -Force .certs | Out-Null
   mkcert -key-file .certs/localhost-key.pem -cert-file .certs/localhost.pem localhost 127.0.0.1 ::1
   ```

   Sertifikat dan private key tersimpan lokal di `.certs/` dan tidak masuk Git. `mkcert -install` menambahkan CA lokal ke trust store Windows; mulai ulang browser setelah instalasi bila perlu.
8. Jalankan Worker lokal dengan binding D1 dan sertifikat tepercaya: `pnpm dev`, lalu buka `https://localhost:8787`. Jika muncul `CertificateUnknown`, pastikan sertifikat `.certs` dibuat oleh `mkcert -install` dan hostname yang dibuka adalah `localhost`.
9. Siapkan tabel akun lokal satu kali dengan POST ke `https://localhost:8787/api/dev/auth/migrate`. Dengan sertifikat tepercaya, gunakan `curl.exe -X POST https://localhost:8787/api/dev/auth/migrate` tanpa opsi `-k`.

`pnpm dev` membangun Worker sebelum Wrangler menjalankannya; endpoint API, autentikasi, dan D1 lokal tersedia pada origin HTTPS tersebut. Build Worker lokal tidak menjalankan minifikasi Nitro agar Terser tidak membuat pool worker sebanyak jumlah CPU, yang dapat gagal mengalokasikan worker pada Windows; bundle client tetap diminifikasi. `pnpm build` dan `pnpm deploy` tetap memakai minifikasi Nitro. `pnpm dev:https:untrusted` menjalankan sertifikat self-signed bawaan Wrangler (browser dapat menolaknya dengan `CertificateUnknown`). Untuk HTTP, gunakan `pnpm dev:http` dan set `BETTER_AUTH_URL=http://localhost:8787`. Jika mengganti protokol, `BETTER_AUTH_URL` harus cocok dengan URL browser agar callback autentikasi dan cookie benar. `pnpm dev:ui` hanya untuk iterasi UI dengan HMR dan tidak menyediakan binding D1 atau API Worker. `pnpm preview` menjalankan Worker lokal seperti `pnpm dev`.

Jalankan `pnpm typecheck` dan `pnpm test` untuk pemeriksaan tipe serta tes otomatis. Periksa integritas dan relasi D1 lokal tanpa menyentuh database production:

```powershell
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA foreign_key_check;"
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA table_info('story_content');"
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA foreign_key_list('stories');"
```

`foreign_key_check` semestinya tidak mengembalikan baris. Tes `pnpm test` menjalankan migrasi terhadap database SQLite sementara dan memeriksa pemindahan data, struktur 3NF, foreign key, serta cascade delete. Skema cerita menyimpan atribut cerita di `story_content`, foto dan bab dalam tabel anak berurutan, detail template di tabel satu-ke-satu, serta data publikasi/draft terpisah. Migrasi `0006_normalize_story_content.sql` memindahkan data JSON lama dan menghapus kolom JSON; `0007_cascade_story_content.sql` membersihkan konten ketika metadata cerita/draft dihapus. Backup database sebelum menerapkan migrasi remote.

Galeri dan foto yang dipilih di studio diunggah langsung ke Cloudinary menggunakan tanda tangan yang dibuat backend. Untuk unggah foto, isi ketiga variabel Cloudinary; jika `.env` dan `.dev.vars` sama-sama dipakai, pastikan keduanya berisi kredensial akun yang sama. URL gambar HTTPS juga bisa dimasukkan langsung. Contoh hasil bisa dilihat tanpa mengisi form di `/preview`. Alur pembuatan dimulai dari `/templates`; tiap kartu membuka preview utuh dan meneruskan pilihan ke editor.

## Siapkan Cloudflare

1. Login ke akun Cloudflare yang benar: `pnpm exec wrangler login`. D1 dan account ID proyek ini sudah terhubung di `wrangler.toml`; jangan membuat database baru kecuali memang ingin memindahkan data.
2. Dari dashboard Cloudflare/Turnstile, buat widget untuk hostname production. Atur Worker variables `BETTER_AUTH_URL`, `EMAIL_FROM`, `ACCESS_TEAM_DOMAIN`, `CLOUDINARY_CLOUD_NAME`, dan `NUXT_PUBLIC_TURNSTILE_SITE_KEY` dengan nilai dari domain/akun milikmu. Site key Turnstile adalah nilai publik; secret key-nya bukan.
3. Isi secret Worker secara interaktif (Wrangler meminta nilainya, jadi nilainya tidak perlu dikirim ke chat atau ditulis ke source):
   - `pnpm exec wrangler secret put BETTER_AUTH_SECRET`
   - `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY`
   - `pnpm exec wrangler secret put RESEND_API_KEY`
   - `pnpm exec wrangler secret put CLOUDINARY_API_KEY`
   - `pnpm exec wrangler secret put CLOUDINARY_API_SECRET`
   - Untuk admin, setelah membuat Cloudflare Access application: `pnpm exec wrangler secret put ACCESS_AUD` dan `pnpm exec wrangler secret put ADMIN_EMAILS`.
4. Periksa nama secret yang terpasang (tanpa membaca nilainya): `pnpm exec wrangler secret list`. Pastikan semua variable/secret yang dibutuhkan sudah tersedia sebelum membuka trafik.
5. Terapkan migrasi D1 production setelah memeriksa akun dan target: `pnpm db:remote`. Perintah ini mengubah database remote.
6. Deploy dengan `pnpm run deploy`. Setelah menyiapkan Cloudflare Access untuk `/admin*` dan `/api/admin/*`, buka `/admin` melalui Access lalu tekan **Siapkan tabel akun** satu kali.
7. Dari browser, verifikasi `/register`, verifikasi email, masuk, pembuatan draft, publish, dan link publik. Atur WAF/Rate Limiting Cloudflare sebelum membuka trafik publik.

Pastikan sudah login dengan `pnpm exec wrangler login`. Database `kekasih-db` sudah dikaitkan ke proyek ini. Kredensial API Cloudinary tidak pernah dikirim ke browser; hanya API key publik dan tanda tangan upload yang berumur pendek yang digunakan untuk unggahan.

### Akun pengguna, draft, dan panel admin

- Pengunjung dapat mendaftar di `/register` atau masuk di `/login` dengan email dan sandi (minimal 12 karakter). Permintaan pendaftaran, masuk, reset, dan perubahan sandi diverifikasi Turnstile di server; pengguna harus memverifikasi email sebelum masuk. Email verifikasi dan reset sandi dikirim melalui Resend. Tidak ada akun default atau password admin.
- Better Auth menyimpan user, sesi, credential, dan token verifikasi di D1. Sesi memakai cookie aman/HTTP-only pada HTTPS; jangan gunakan `BETTER_AUTH_SECRET` yang berbeda antara deploy/instance karena sesi dan tautan verifikasi bergantung padanya.
- Setelah masuk, `/account` menampilkan draft dan cerita milik akun. Pengguna dapat melanjutkan draft, mengedit cerita terbit, mengaktifkan/nonaktifkan cerita, menyalin tautan, dan menghapus konten miliknya. Cerita nonaktif tidak bisa dibuka dari route publik maupun endpoint unlock. API memeriksa `user.id` sesi pada setiap operasi; mengetahui slug/id cerita saja tidak cukup untuk mengubah atau menghapusnya.
- Setiap cerita baru menyimpan `owner_user_id`. Cerita lama sebelum migrasi kepemilikan tetap dapat dilihat publik dan dikelola admin, tetapi tidak muncul sebagai milik akun pengguna karena pemilik sebelumnya tidak diketahui.
- Tabel Better Auth dibuat melalui migrasi terprogram yang hanya tersedia lewat endpoint admin Access di produksi. Tombol **Siapkan tabel akun** pada `/admin` menjalankan migrasi idempoten. Di lokal, endpoint migrasi khusus hanya aktif saat `pnpm dev` dan hanya menerima host loopback.
- Akun pengguna bersifat pendaftaran mandiri; penerbitan cerita tidak memerlukan persetujuan admin. Pasang Cloudflare Rate Limiting/WAF untuk endpoint autentikasi sebelum membuka pendaftaran publik.

Halaman `/login` dan `/register` memakai route serta mode form yang terpisah dengan satu komponen akun bersama; tautan antarhalaman mempertahankan parameter redirect yang tervalidasi. Antarmuka akun, admin, studio, dan autentikasi memakai palet utama situs. Tema khusus hanya diterapkan ke halaman cerita dan preview template.

#### Model data D1

- `story_content` menyimpan atribut skalar satu cerita.
- `story_gallery_items` dan `story_chapters` menyimpan daftar foto/bab dengan kunci urutan `(content_id, position)`.
- `story_template_editorial`, `story_template_cinema`, dan `story_template_botanical` menyimpan atribut opsional satu-ke-satu per desain.
- `stories` menyimpan metadata publikasi, kepemilikan, sandi, slug, dan status; `story_drafts` menyimpan metadata draft dan progres editor.
- Skema cerita memenuhi 3NF dengan atribut skalar, detail template, daftar galeri/bab, metadata publikasi, dan metadata draft dipisah menurut ketergantungan fungsionalnya. Payload JSON lama dikonversi oleh migrasi `0006`; endpoint aplikasi membaca/menulis model relasional. Migrasi `0007` menjaga cascade delete untuk konten terkait.

Jalankan `pnpm db:local` setelah checkout atau perubahan migrasi. `PRAGMA foreign_key_check` memeriksa integritas relasi; `PRAGMA table_info(...)` dan `PRAGMA foreign_key_list(...)` membantu memeriksa struktur. Untuk perubahan skema di Cloudflare production, backup dahulu dan terapkan hanya dengan `pnpm db:remote` setelah memverifikasi target.

#### Konfigurasi autentikasi, email, dan pemeriksaan manusia

1. Verifikasi domain pengirim email di Resend; `EMAIL_FROM` harus menggunakan alamat pada domain terverifikasi itu.
2. Set `BETTER_AUTH_URL` ke origin situs yang sebenarnya (contoh `https://cerita.example.com`) sebagai Worker variable.
3. Simpan secret dengan Wrangler; perintah akan meminta nilainya secara interaktif:
   - `pnpm exec wrangler secret put BETTER_AUTH_SECRET` — secret acak minimal 32 karakter; buat dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
   - `pnpm exec wrangler secret put RESEND_API_KEY`.
   - `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY` — secret server dari widget Cloudflare Turnstile.
4. Atur `EMAIL_FROM`, misalnya `Selamanya <noreply@domain-terverifikasi.example>`, sebagai Worker variable. Untuk lokal, isi `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, dan `EMAIL_FROM` di `.dev.vars`; jangan commit `.dev.vars` atau secret.
5. Tambahkan `NUXT_PUBLIC_TURNSTILE_SITE_KEY` sebagai Worker variable non-secret dengan site key dari widget yang hostname-nya sesuai dengan `BETTER_AUTH_URL`. Untuk lokal, `.dev.vars.example` menggunakan pasangan test key Cloudflare; gunakan hanya di lokal, bukan production.
6. Untuk produksi, jalankan `pnpm db:remote`, deploy dengan `pnpm run deploy`, lalu buka `/admin` melalui Cloudflare Access dan tekan **Siapkan tabel akun** satu kali. Setelah berhasil, `/register` dapat menerima pendaftaran. Endpoint autentikasi mengembalikan 503 bila secret Turnstile belum disetel (fail closed).
7. Lindungi `/admin*` dan `/api/admin/*` dengan aplikasi/policy Cloudflare Access terpisah dari pendaftaran akun biasa. Jangan lindungi seluruh domain dengan policy admin; halaman cerita publik dan endpoint login harus tetap dapat dijangkau pengguna.

#### Cara memeriksa alur pengguna

1. Buka `/register`, buat akun, dan klik link verifikasi dari email.
2. Masuk, pilih template di `/templates`, lalu mulai draft di editor. Periksa `/account` dan buka **Lanjutkan** untuk memastikan draft tetap ada.
3. Terbitkan cerita, edit melalui `/account`, periksa link publik, lalu hapus cerita atau draft uji.
4. Gunakan **Lupa sandi?** untuk memeriksa email reset; tautan kedaluwarsa/tidak valid harus ditolak.
5. Coba membuka API milik pengguna lain dengan sesi berbeda. API seharusnya mengembalikan 404 dan tidak membocorkan kontennya.

- Studio menyimpan perubahan ke D1 secara otomatis. `localStorage` hanya menyimpan cache pemulihan per akun; isi utama draft tetap dapat dibuka dari perangkat lain setelah masuk.
- Untuk mengaktifkan admin, buat aplikasi Cloudflare Access yang melindungi `/admin*` dan `/api/admin/*`, lalu buat kebijakan yang hanya mengizinkan akun admin tertentu.
- Tambahkan `ACCESS_TEAM_DOMAIN` sebagai Worker variable (misalnya `nama-tim.cloudflareaccess.com`), dan simpan audience serta daftar email sebagai secrets:
  `pnpm exec wrangler secret put ACCESS_AUD`
  `pnpm exec wrangler secret put ADMIN_EMAILS`
  `ADMIN_EMAILS` berisi email yang dipisahkan koma. Jangan commit nilai-nilai ini. Untuk lokal, isi `.dev.vars` berdasarkan `.dev.vars.example`.
- Halaman `/admin` menampilkan cerita terbit dan draft serta menyediakan penghapusan. Token Access diverifikasi menggunakan signature, issuer, audience, masa berlaku, dan daftar email.

### Proteksi trafik

Rate limit aplikasi:

- Better Auth menyimpan hitungan ke D1: masuk maksimal 5/menit, daftar 5/jam, reset sandi 3/jam, dan reset/verifikasi 5 atau 3/jam.
- D1 juga membatasi pembuatan draft (20/jam), autosave (120/menit), unggah signature (12/menit), publish (5/jam), perubahan cerita (20/10 menit), dan unlock cerita (5/15 menit per IP + slug). IP tidak disimpan; key rate limit berupa SHA-256.
- Respons yang dibatasi mengembalikan HTTP 429 dan `Retry-After`. Pembatasan aplikasi tidak menggantikan mitigasi di edge; semua permintaan tetap dapat mencapai Worker sebelum aturan WAF berlaku.

Sebelum membuka situs publik, aktifkan juga Cloudflare WAF/Rate Limiting Rules dari dashboard untuk memotong trafik sebelum Worker: buat aturan berlingkup `POST` untuk `/api/auth/*`, `/api/uploads/signature`, `/api/stories`, dan `/api/stories/*/unlock`; gunakan hitungan per IP, tantang/blokir burst autentikasi dan unlock, dan buat batas unggah/publish terpisah. Ambang dan durasi fitur dashboard berbeda menurut paket Cloudflare, jadi uji false positive pada trafik aktual. Pastikan DNS memakai proxy Cloudflare agar header IP tepercaya tersedia untuk rate limiter aplikasi. Jika menggunakan aturan cache khusus, bypass cache untuk `/w/*` dan `/api/stories/*` agar penonaktifan cerita langsung berlaku. Proteksi DDoS Cloudflare mengurangi risiko tetapi tidak menjamin kekebalan terhadap semua serangan.

## Fitur

- Halaman depan sinematik, navigasi sticky, animasi GSAP dengan ScrollTrigger, lifecycle cleanup, dukungan reduced motion, dan kursor responsif.
- Pemilih template sebelum editor, preview utuh per desain, komposisi dan input khas untuk Editorial Rose, Midnight Cinema, dan Botanical Journal; editor juga menyediakan preset kursor yang di-whitelist.
- Studio bertahap dengan autosave dan pemulihan draft D1, pratinjau yang memakai renderer sama dengan halaman cerita publik, serta pengaktifan/nonaktifkan cerita tanpa menghapusnya.
- Akun pengguna dengan email terverifikasi, login, reset sandi, dan pengelolaan privat atas draft serta cerita sendiri.
- Validasi payload di browser/API menggunakan skema Zod; foto diunggah ke Cloudinary.
- Publikasi cerita ke D1, tautan berbagi, kode QR, dan proteksi sandi PBKDF2.
- Panel `/admin` di balik Cloudflare Access untuk melihat dan menghapus cerita maupun draft.
- Halaman publik responsif dengan kartu, galeri bergerak, buku cerita, dan pemutar lagu opsional.
- Pratinjau template lengkap tersedia di `/preview` tanpa perlu mengisi atau mengubah form.

## Catatan

Sandi cerita dapat melindungi akses, tetapi tautan publik dan aset foto Cloudinary tetap dapat dibagikan ulang oleh penerima. Gunakan URL audio langsung untuk pemutar lagu. Domain khusus, aturan akses tambahan, pembatasan unggahan, dan moderasi konten dapat dikonfigurasi sesuai kebutuhan produksi.
