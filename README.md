# Selamanya — Website for Kekasih

Template sinematik untuk menyusun dan menerbitkan cerita pasangan. Dibangun dengan Nuxt 4, Tailwind CSS, GSAP, Zod, Cloudflare Workers + D1, dan Cloudinary.

## Jalankan lokal

1. Pasang Node.js 22.22.3+, 24.15.0+, atau 26+ dan pnpm 10.33.0.
2. `pnpm install`
3. Gunakan binding D1 yang sudah tercantum di `wrangler.toml`. `pnpm db:local` membuat/menyiapkan database lokal; jangan menjalankan `wrangler d1 create` atau `pnpm db:remote` untuk pengujian lokal.
4. Siapkan `.dev.vars` (file lokal ini diabaikan Git). `BETTER_AUTH_SECRET` harus berupa nilai acak minimal 32 karakter; `NUXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` boleh memakai pasangan test di `.dev.vars.example` hanya untuk localhost. Email autentikasi memakai Gmail API; isi `GMAIL_SENDER_EMAIL` dan kredensial OAuth Gmail, termasuk `GOOGLE_OAUTH_REFRESH_TOKEN`, sesuai bagian **Konfigurasi autentikasi, email, dan pemeriksaan manusia**. Foto menggunakan kredensial Cloudinary lokal.
5. Untuk HTTPS lokal, set `BETTER_AUTH_URL=https://localhost:8787` di `.dev.vars` dan buka aplikasi menggunakan `https://localhost:8787` (bukan alamat IP). Konfigurasi lokal menerima hostname Turnstile `localhost` dan `127.0.0.1` pada origin/protokol/port yang sama untuk menghindari kegagalan jika browser membuka alamat IP. Jangan gunakan site key Turnstile production di localhost.
6. Terapkan skema D1 lokal: `pnpm db:local`.
7. Pasang `mkcert` di Windows (contoh: `winget install FiloSottile.mkcert`), buka terminal baru, lalu jalankan sekali:

   ```powershell
   mkcert -install
   New-Item -ItemType Directory -Force .certs | Out-Null
   mkcert -key-file .certs/localhost-key.pem -cert-file .certs/localhost.pem localhost 127.0.0.1 ::1
   ```

   Sertifikat dan private key tersimpan lokal di `.certs/` dan tidak masuk Git. `mkcert -install` menambahkan CA lokal ke trust store Windows; mulai ulang browser setelah instalasi bila perlu.
8. Jalankan Worker lokal dengan binding D1 dan sertifikat tepercaya: `pnpm dev`, lalu buka `https://localhost:8787`. Port dipatok ke 8787 supaya halaman dan API autentikasi tetap di origin yang sama; jika port sedang dipakai, hentikan Worker lama sebelum memulai yang baru. Jika muncul `CertificateUnknown`, pastikan sertifikat `.certs` dibuat oleh `mkcert -install` dan hostname yang dibuka adalah `localhost`.
9. Tidak ada setup autentikasi terpisah: migrasi pada langkah 6 sudah menyiapkan tabel Better Auth dan role.

`pnpm dev` membangun Worker sebelum Wrangler menjalankannya; endpoint API, autentikasi, dan D1 lokal tersedia pada origin HTTPS tersebut. `wrangler.toml` sengaja tidak menetapkan `main`; Nitro menghasilkan `wrangler.json` di `.output/server` dengan entrypoint dan binding deployment. Skrip `dev` dan `deploy` menjalankan Wrangler dengan `--cwd .output` sesuai konfigurasi generated Nitro, menghindari konflik antara konfigurasi root dan redirect deploy yang dibuat saat build. `scripts/dev-worker.mjs` memberi Wrangler path absolut ke `.dev.vars`, karena Wrangler mengubah working directory dan menyelesaikan `--env-file` dari beberapa direktori. File vars harus tetap lokal dan tidak boleh dicetak atau dikomit. Dev Worker menetapkan `--persist-to ../.wrangler/state` agar D1 lokal yang sama digunakan oleh `pnpm db:local` dan Wrangler preview. `pnpm check:worker` memeriksa output Worker aktual beserta binding D1 dan assets. Minifikasi Nitro tetap aktif di dev dan production, dengan jumlah worker Terser dibatasi menjadi dua agar build stabil di Windows dan mesin dengan sumber daya terbatas. `pnpm dev:https:untrusted` menjalankan sertifikat self-signed bawaan Wrangler (browser dapat menolaknya dengan `CertificateUnknown`). Untuk HTTP, gunakan `pnpm dev:http` dan set `BETTER_AUTH_URL=http://localhost:8787`. Skrip dev mematok port 8787; bila port itu sudah dipakai, hentikan Worker lama sebelum memulai yang baru. Gunakan host, protokol, dan port yang sama untuk halaman dan API. Konfigurasi lokal menerima origin loopback (`localhost` atau `127.0.0.1`) pada port request aktif jika protokolnya sama dengan `BETTER_AUTH_URL`; ini hanya untuk loopback dan tidak menambahkan origin arbitrer di production. Better Auth membaca alamat klien dari header tepercaya `cf-connecting-ip` yang ditetapkan Cloudflare; header forwarding buatan klien tidak dipercaya. `pnpm dev:ui` hanya untuk iterasi UI dengan HMR dan tidak menyediakan binding D1 atau API Worker. `pnpm preview` menjalankan Worker lokal seperti `pnpm dev`.

Jalankan `pnpm typecheck` dan `pnpm test` untuk pemeriksaan tipe serta tes otomatis. Periksa integritas dan relasi D1 lokal tanpa menyentuh database production:

```powershell
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA foreign_key_check;"
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA table_info('story_content');"
pnpm exec wrangler d1 execute kekasih-db --local --command "PRAGMA foreign_key_list('stories');"
```

`foreign_key_check` semestinya tidak mengembalikan baris. Tes `pnpm test` menjalankan migrasi terhadap database SQLite sementara dan memeriksa pemindahan data, struktur 3NF, foreign key, serta cascade delete. `tests/api-workflows.test.mjs` menjalankan handler aplikasi aktual dengan shim H3, autentikasi tiruan, dan adapter SQLite Node; tes ini bukan runtime Cloudflare Workers atau integrasi D1/Better Auth. Untuk pemeriksaan D1 lokal yang terisolasi, gunakan Wrangler dengan direktori persist terpisah (jangan tambahkan `--remote`):

```powershell
pnpm exec wrangler d1 migrations apply kekasih-db --local --persist-to .data/phase2-d1
pnpm exec wrangler d1 execute kekasih-db --local --persist-to .data/phase2-d1 --command "PRAGMA foreign_key_check;"
```

`.data/` diabaikan Git. Skema cerita menyimpan atribut cerita di `story_content`, foto dan bab dalam tabel anak berurutan, detail template di tabel satu-ke-satu, serta data publikasi/draft terpisah. Migrasi `0006_normalize_story_content.sql` memindahkan data JSON lama dan menghapus kolom JSON; `0007_cascade_story_content.sql` membersihkan konten ketika metadata cerita/draft dihapus. Backup database sebelum menerapkan migrasi remote.

Galeri dan foto yang dipilih di studio diunggah melalui endpoint aplikasi terautentikasi ke Cloudinary. Untuk unggah foto, isi ketiga variabel Cloudinary; jika `.env` dan `.dev.vars` sama-sama dipakai, pastikan keduanya berisi kredensial akun yang sama. Backend memeriksa magic bytes dan ukuran maksimum 10 MB sebelum mengirim format `jpg,jpeg,png,webp` ke folder khusus per akun. Upload preset Cloudinary tidak diperlukan. URL gambar HTTPS juga bisa dimasukkan langsung ke konten cerita. Tautan lagu mendukung pemutar Spotify dan YouTube Music (lagu maupun playlist), atau URL HTTPS ke file audio langsung. Contoh hasil bisa dilihat tanpa mengisi form di `/preview`, termasuk mengganti gaya melalui pemilih preview. Ilustrasi contoh disimpan lokal agar pratinjau tetap tampil saat jaringan eksternal diblokir. Katalog `/templates` mendukung pencarian, kategori, dan pagination yang tersimpan di query URL; template yang tersedia saat ini masuk kategori **Pasangan**, sementara **Kartu ucapan** dan **Undangan** menampilkan keadaan kosong sampai editor/template khususnya tersedia. Tiap kartu membuka preview utuh yang bisa ditutup dan meneruskan pilihan ke editor. Pada langkah **Lagu & privasi**, pemilik dapat menentukan slug link berbagi 3–32 karakter huruf/angka yang dipisahkan tanda hubung; database menerapkan batas unik untuk slug, dan link lama berubah setelah slug cerita diperbarui. Draft menyimpan pilihan slug tersebut di D1 melalui migrasi `0010_add_draft_custom_slug.sql`; jalankan `pnpm db:local` untuk lokal atau, setelah backup dan memastikan target akun benar, `pnpm db:remote` sebelum deploy production.

Kode antarmuka mengikuti struktur Nuxt 4 di `app/`: halaman ada di `app/pages/`, komponen di `app/components/`, middleware aplikasi di `app/middleware/`, dan CSS di `app/assets/`. Kode runtime backend mengikuti struktur Nuxt di `server/`: endpoint API di `server/api/`, helper server di `server/utils/`, route non-API di `server/routes/` bila diperlukan, dan middleware server global di `server/middleware/` bila diperlukan. Skema/data bersama ada di `shared/`, aset publik di `public/`, sedangkan migrasi D1 tetap di root `migrations/` karena `wrangler.toml` menunjuk direktori tersebut melalui `migrations_dir`.

Struktur layout cerita per template berada di `app/components/story-templates/layouts/`. Setiap layout menentukan urutan dan pengelompokan section; isi section memakai data cerita yang sama di `app/components/StoryExperience.vue`. Registry `app/components/story-templates/registry.ts` memetakan renderer, sementara stylesheet khusus di `app/assets/css/templates/` dimuat scoped dari `StoryExperience.vue` agar precedence dengan style section tetap konsisten. Selector stylesheet dibatasi oleh root `.template-<id>` agar tidak bocor ke template lain. **Memory Atlas** memakai komposisi timeline vertikal, arsip foto horizontal, dan bab atlas. Untuk menambah template, buat layout dan stylesheet bernamespace, lalu daftarkan renderer pada registry serta metadata/schema di `shared/story-templates.ts`. Animasi scroll mendeteksi container scroll halaman maupun modal editor/template agar semua section tetap terungkap saat digulir.

## Siapkan Cloudflare

1. Login ke akun Cloudflare yang benar: `pnpm exec wrangler login`. D1 dan account ID proyek ini sudah terhubung di `wrangler.toml`; jangan membuat database baru kecuali memang ingin memindahkan data.
2. Dari dashboard Cloudflare/Turnstile, buat widget untuk hostname production. Atur Worker variables `BETTER_AUTH_URL`, `GMAIL_SENDER_EMAIL`, `CLOUDINARY_CLOUD_NAME`, dan `NUXT_PUBLIC_TURNSTILE_SITE_KEY` dengan nilai dari domain/akun milikmu. Pengiriman email autentikasi memakai Gmail API. Site key Turnstile adalah nilai publik; secret key-nya bukan.
3. Isi secret Worker secara interaktif (Wrangler meminta nilainya, jadi nilainya tidak perlu dikirim ke chat atau ditulis ke source):
   - `pnpm exec wrangler secret put BETTER_AUTH_SECRET`
   - `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY`
   - `pnpm exec wrangler secret put GOOGLE_OAUTH_CLIENT_ID`
   - `pnpm exec wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET`
   - `pnpm exec wrangler secret put GOOGLE_OAUTH_REFRESH_TOKEN` — perlakukan sebagai password.
   - `pnpm exec wrangler secret put CLOUDINARY_API_KEY`
   - `pnpm exec wrangler secret put CLOUDINARY_API_SECRET`
   - `pnpm exec wrangler secret put ADMIN_EMAILS` — daftar email admin yang dipisahkan koma.
4. Periksa nama secret yang terpasang (tanpa membaca nilainya): `pnpm exec wrangler secret list`. Pastikan juga `CLOUDINARY_CLOUD_NAME` terisi di `[vars]` pada `wrangler.toml`; nilai kosong akan menggagalkan `pnpm check:worker`.
5. Periksa migration remote secara read-only dengan `pnpm exec wrangler d1 migrations list kekasih-db --remote` dan cocokkan dengan `d1_migrations`. Jangan jalankan migration sebagai bagian dari deploy. Jika migration tertunda, hentikan release, tinjau dampaknya, buat backup, dan dapatkan persetujuan eksplisit sebelum menerapkannya.
6. Jalankan `pnpm build`, `pnpm check:worker`, dan `pnpm exec wrangler deploy .output/server/index.mjs --dry-run`. Dry run tidak menggantikan persetujuan deploy.
7. Setelah target, konfigurasi, migration, domain, dan rencana rollback diverifikasi serta deploy disetujui, jalankan `pnpm run deploy`. Skrip deploy membangun dan memvalidasi output Worker sebelum Wrangler mengirim versi baru.
8. Setelah deploy yang disetujui, jalankan smoke test pada `/api/health`, autentikasi, dashboard, editor, dan public story uji; pastikan tidak ada 5xx atau error email/upload. Atur WAF/Rate Limiting Cloudflare sebelum membuka trafik publik.

Pastikan sudah login dengan `pnpm exec wrangler login`. Database `kekasih-db` sudah dikaitkan ke proyek ini. Kredensial API Cloudinary tidak pernah dikirim ke browser; hanya API key publik dan tanda tangan upload yang berumur pendek yang digunakan untuk unggahan.

### Akun pengguna, draft, dan panel admin

- Tidak ada password admin default. Admin mendaftar sendiri di `/register` memakai email yang tercantum di `ADMIN_EMAILS`, memilih username dan password (minimal 12 karakter), lalu login di `/login` dengan username/email dan password pilihannya. Setelah setup skema, pendaftaran, login, permintaan email reset, dan pengiriman ulang aktivasi dilindungi Turnstile. Penggantian sandi dengan token sekali pakai dari email tidak meminta CAPTCHA kedua; token diverifikasi, dikonsumsi sekali, dan endpoint tetap dibatasi rate limit. Akun harus memverifikasi email sebelum login; Better Auth saat ini mengirim email melalui Gmail API. Helper Resend tidak dikonfigurasi sebagai fallback.
- Better Auth menyimpan user, sesi, credential, dan token verifikasi di D1; role tersimpan di `user_roles`. Sesi memakai cookie aman/HTTP-only pada HTTPS; jangan gunakan `BETTER_AUTH_SECRET` yang berbeda antara deploy/instance karena sesi dan tautan verifikasi bergantung padanya.
- Setelah masuk, `/account` menampilkan draft dan cerita milik akun. Pengguna dapat melanjutkan draft, mengedit cerita terbit, mengaktifkan/nonaktifkan cerita, menyalin tautan, dan menghapus konten miliknya. Cerita nonaktif tidak bisa dibuka dari route publik maupun endpoint unlock. API memeriksa `user.id` sesi pada setiap operasi; mengetahui slug/id cerita saja tidak cukup untuk mengubah atau menghapusnya.
- Setiap cerita baru menyimpan `owner_user_id`. Cerita lama sebelum migrasi kepemilikan tetap dapat dilihat publik dan dikelola admin, tetapi tidak muncul sebagai milik akun pengguna karena pemilik sebelumnya tidak diketahui.
- Tabel Better Auth dan role dikelola sebagai migrasi D1 biasa di `migrations/0008_create_better_auth_tables.sql` dan `migrations/0009_seed_existing_user_roles.sql`. Jalankan `pnpm db:local` untuk lokal atau backup dahulu lalu `pnpm db:remote` untuk production; tidak ada halaman setup, token bootstrap, maupun migrasi runtime.
- Role akun memiliki nilai `user` atau `admin`. Email yang dicantumkan di `ADMIN_EMAILS` otomatis mendapat role `admin` saat mendaftar; akun admin lama yang sudah terdaftar dipromosikan oleh seeder idempoten ketika pertama kali membuka panel admin. Pengguna lain tidak dapat mengirim atau mengubah field role sendiri.
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

1. **Gmail API:** buat project di Google Cloud Console, aktifkan Gmail API, konfigurasi OAuth consent screen, dan buat OAuth client. Beri scope `https://www.googleapis.com/auth/gmail.send`; saat consent screen berstatus Testing, tambahkan akun Gmail pengirim sebagai test user. Isi `GOOGLE_OAUTH_CLIENT_ID` dan `GOOGLE_OAUTH_CLIENT_SECRET` di `.dev.vars`, lalu jalankan `pnpm gmail:oauth` untuk memperoleh refresh token. Helper lokal meminta `access_type=offline` dan `prompt=consent`, menerima callback hanya di `127.0.0.1:53682`, dan menyimpan refresh token langsung ke `.dev.vars` tanpa menampilkan nilainya. Jika memakai OAuth client tipe Web application, daftarkan `http://127.0.0.1:53682/` sebagai Authorized redirect URI; Desktop app juga dapat dipakai. Atur `GMAIL_SENDER_EMAIL` ke alamat Gmail yang sama dengan akun OAuth. Simpan ketiga kredensial OAuth sebagai secret di production. Untuk penggunaan production, ubah Publishing status OAuth consent screen ke **In production**, selesaikan verifikasi Google yang diminta untuk scope sensitif Gmail, lalu jalankan ulang `pnpm gmail:oauth` untuk membuat token baru setelah status berubah. Refresh token dari aplikasi External yang masih Testing untuk scope Gmail biasanya kedaluwarsa setelah 7 hari, sehingga tidak cocok untuk production. Email autentikasi dikirim sebagai multipart HTML dan teks biasa dengan identitas Selamanya yang konsisten, tautan tindakan yang jelas, dan tanpa lampiran atau konten promosi. Format profesional membantu pengalaman penerima tetapi tidak menjamin inbox; gunakan hanya untuk permintaan akun yang diminta pengguna, pertahankan reputasi akun pengirim, dan pantau Spam/bounce. Gmail dan penyedia penerima tetap menentukan penempatan inbox serta menerapkan kuota dan kebijakan masing-masing.
2. Gmail dapat menempatkan email di Spam/Promosi. Setelah daftar, pengguna dapat menekan **Kirim ulang email aktivasi** di halaman masuk/daftar; endpoint ini memerlukan Turnstile dan dibatasi tiga kali per jam.
3. Set `BETTER_AUTH_URL` ke origin situs yang sebenarnya (contoh `https://cerita.example.com`) sebagai Worker variable.
4. Simpan secret dengan Wrangler; perintah akan meminta nilainya secara interaktif:
   - `pnpm exec wrangler secret put BETTER_AUTH_SECRET` — secret acak minimal 32 karakter; buat dengan `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
   - `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY` — secret server dari widget Cloudflare Turnstile.
5. Atur `GMAIL_SENDER_EMAIL` sebagai Worker variable. Untuk lokal, isi variabel Gmail dan kredensial OAuth di `.dev.vars`; jangan commit `.dev.vars` atau secret.
6. Tambahkan `NUXT_PUBLIC_TURNSTILE_SITE_KEY` sebagai Worker variable non-secret dengan site key dari widget yang hostname-nya sesuai dengan `BETTER_AUTH_URL`. Untuk lokal, `.dev.vars.example` menggunakan pasangan test key Cloudflare; gunakan hanya di lokal, bukan production.
8. Untuk produksi, backup D1, jalankan `pnpm db:remote`, kemudian `pnpm run deploy`. Admin menggunakan alur yang sama seperti pengguna: daftar di `/register` memakai email dalam `ADMIN_EMAILS`, verifikasi email, lalu masuk di `/login`. Akun mendapat role admin otomatis. Endpoint autentikasi mengembalikan 503 bila secret Turnstile belum disetel (fail closed).
9. Jangan pasang Cloudflare Access pada `/admin*` atau `/api/admin/*` secara menyeluruh. Sesi Better Auth, role, dan allowlist email melindungi panel/API. Halaman cerita publik dan endpoint login harus tetap dapat dijangkau pengguna.

#### Cara memeriksa alur pengguna

1. Buka `/register`, buat akun, dan klik link verifikasi dari email.
2. Masuk, pilih template di `/templates`, lalu mulai draft di editor. Periksa `/account` dan buka **Lanjutkan** untuk memastikan draft tetap ada.
3. Terbitkan cerita, edit melalui `/account`, periksa link publik, lalu hapus cerita atau draft uji.
4. Gunakan **Lupa sandi?** untuk memeriksa email reset; tautan kedaluwarsa/tidak valid harus ditolak.
5. Coba membuka API milik pengguna lain dengan sesi berbeda. API seharusnya mengembalikan 404 dan tidak membocorkan kontennya.

- Studio menyimpan perubahan ke D1 secara otomatis. `localStorage` hanya menyimpan cache pemulihan per akun; isi utama draft tetap dapat dibuka dari perangkat lain setelah masuk.
- Daftarkan email admin pada secret `ADMIN_EMAILS` (email dipisahkan koma). Admin memilih password sendiri saat mendaftar di `/register`; tidak ada kredensial bawaan yang dapat diambil. Login memakai username/email di `/login`; server memeriksa sesi dan allowlist email pada setiap endpoint admin.
- `ADMIN_EMAILS` adalah allowlist sekaligus sumber role admin. Pengguna admin tetap memilih kata sandi sendiri melalui formulir pendaftaran biasa; tidak ada password default atau akun admin rahasia yang disisipkan.
- Halaman `/admin` menampilkan cerita terbit dan draft serta menyediakan penghapusan. Pengguna yang login tetapi emailnya tidak masuk `ADMIN_EMAILS` tetap ditolak.

### Proteksi trafik

Rate limit aplikasi:

- Better Auth menyimpan hitungan ke D1: masuk melalui email maupun username maksimal 5/menit, daftar 5/jam, reset sandi 3/jam, dan reset/verifikasi 5 atau 3/jam.
- D1 juga membatasi pembuatan draft (20/jam), autosave (120/menit), unggah signature (12/menit), publish (5/jam), perubahan cerita (20/10 menit), dan unlock cerita (5/15 menit per IP + slug). IP tidak disimpan; key rate limit berupa SHA-256.
- Respons yang dibatasi mengembalikan HTTP 429 dan `Retry-After`. Pembatasan aplikasi tidak menggantikan mitigasi di edge; semua permintaan tetap dapat mencapai Worker sebelum aturan WAF berlaku.

Sebelum membuka situs publik, aktifkan juga Cloudflare WAF/Rate Limiting Rules dari dashboard untuk memotong trafik sebelum Worker: buat aturan berlingkup `POST` untuk `/api/auth/*`, `/api/uploads/signature`, `/api/stories`, dan `/api/stories/*/unlock`; gunakan hitungan per IP, tantang/blokir burst autentikasi dan unlock, dan buat batas unggah/publish terpisah. Ambang dan durasi fitur dashboard berbeda menurut paket Cloudflare, jadi uji false positive pada trafik aktual. Pastikan DNS memakai proxy Cloudflare agar header IP tepercaya tersedia untuk rate limiter aplikasi. Jika menggunakan aturan cache khusus, bypass cache untuk `/w/*` dan `/api/stories/*` agar penonaktifan cerita langsung berlaku. Proteksi DDoS Cloudflare mengurangi risiko tetapi tidak menjamin kekebalan terhadap semua serangan.

## Fitur

- Halaman depan sinematik, navigasi sticky, animasi GSAP dengan ScrollTrigger, lifecycle cleanup, dukungan reduced motion, dan kursor responsif.
- Pemilih template sebelum editor, preview utuh untuk Editorial Rose, Midnight Cinema, Botanical Journal, dan Love Letter; tiap desain memiliki komposisi, nuansa, dan kolom personal yang sesuai. Editor juga menyediakan preset kursor yang di-whitelist.
- Studio bertahap dengan autosave dan pemulihan draft D1, pratinjau yang memakai renderer sama dengan halaman cerita publik, serta pengaktifan/nonaktifkan cerita tanpa menghapusnya.
- Akun pengguna dengan email terverifikasi, login, reset sandi, dan pengelolaan privat atas draft serta cerita sendiri.
- Validasi payload di browser/API menggunakan skema Zod; foto diunggah ke Cloudinary.
- Publikasi cerita ke D1, tautan berbagi, kode QR, dan proteksi sandi PBKDF2.
- Panel `/admin` memakai sesi akun, role `admin`, dan allowlist email admin.
- Halaman publik responsif dengan kartu, galeri bergerak, buku cerita, dan pemutar lagu opsional.
- Pratinjau template lengkap tersedia di `/preview` tanpa perlu mengisi atau mengubah form.

## Catatan

Sandi cerita dapat melindungi akses, tetapi tautan publik dan aset foto Cloudinary tetap dapat dibagikan ulang oleh penerima. Gunakan URL audio langsung untuk pemutar lagu. Domain khusus, aturan akses tambahan, pembatasan unggahan, dan moderasi konten dapat dikonfigurasi sesuai kebutuhan produksi.
