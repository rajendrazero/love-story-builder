# Panduan Pengembangan Template

Dokumen ini mencatat kontrak template cerita yang digunakan GALERRY saat ini. Pertahankan renderer sinkron dan stylesheet yang scoped; jangan memindahkan registry ke pemuatan malas tanpa bukti SSR, urutan CSS, dan tampilan tetap konsisten.

## Struktur saat ini

- `shared/story-templates.ts` menyimpan ID, metadata, fitur, konfigurasi entrance, serta skema kustomisasi template.
- `shared/story-sections.ts` mendefinisikan 15 jenis section, variasi, validasi urutan, preset animasi, dan konten tambahan.
- `shared/schema/story.ts` memvalidasi konten cerita, susunan section, dan variasi yang dipakai draft, publikasi, preview, serta renderer publik.
- `app/components/story-templates/registry.ts` menghubungkan setiap `TemplateRendererId` ke komponen layout Vue.
- `app/components/StoryExperience.vue` memilih layout dari registry, mengurutkan section aktif, dan menerapkan animasi sesuai konfigurasi.
- `app/components/story-experience/StorySectionHost.vue` memetakan setiap jenis section ke renderer terdaftar; `sections/` berisi renderer konten tambahan.
- `app/components/story-section-editor/` menyediakan pengaturan section, variasi, animasi, susunan, dan konten khusus di Studio.
- `server/utils/story-content.ts` menyimpan konfigurasi dan konten section sebagai JSON opsional di D1. Migration `0012_add_composable_story_sections.sql` harus diterapkan melalui alur deployment database normal.

Template yang terdaftar: `editorial-rose`, `midnight-cinema`, `botanical-journal`, `love-letter`, dan `memory-atlas`. Layout kini menjadi pembungkus presentasi; urutan section ditentukan konfigurasi template dan dapat disesuaikan dari Studio.

Template menyediakan komposisi section awal yang berbeda. Pengguna dapat mengaktifkan atau menonaktifkan section, memilih variasi, mengubah animasi, dan menyusun ulang section melalui Studio. Cerita lama tanpa konfigurasi menggunakan susunan bawaan template masing-masing.

### Konten dan keamanan section

- Field cerita yang sudah ada tetap menjadi sumber konten untuk sampul, ucapan, galeri, pertemuan, garis waktu, buku, dan penutup.
- Section momen bergerak menggunakan video ucapan; section musik menggunakan lagu cerita yang sama dengan satu `MusicEngine` global.
- Catatan cinta, peta perjalanan, rencana bersama, hitung mundur, dan kapsul kenangan memakai `sectionContent` opsional yang divalidasi dengan batas panjang.
- Pesan kapsul yang belum mencapai tanggal buka tidak disertakan dalam respons cerita publik. Endpoint kapsul memeriksa tanggal di server, memeriksa sandi cerita jika cerita dilindungi, dan memakai rate limit. Jangan mengirim pesan terkunci ke renderer publik.
- Jika section tambahan diaktifkan, konten wajibnya divalidasi sebelum draft dipublikasikan. Draft tetap dapat disimpan saat konten masih dilengkapi.

## Menambahkan atau mengubah template

1. Tambahkan ID dan metadata ke `storyTemplates` di `shared/story-templates.ts`, termasuk kategori, fitur, warna, status, dan entrance.
2. Jika ada konten kustom, tambahkan skema yang ketat di `templateCustomizationSchemas`, kaitkan `customizationKey`, dan buat default yang valid. Hindari memasukkan data presentasi ke dalam field cerita umum.
3. Tambahkan renderer ke `TemplateRendererId`, buat komponen layout di `app/components/story-templates/layouts/`, lalu daftarkan di `registry.ts`. Registry harus tetap memenuhi `Record<TemplateRendererId, Component>`.
4. Daftarkan jenis dan variasi baru di `shared/story-sections.ts`; hubungkan renderer bertipe di `StorySectionHost.vue` dan tetapkan komposisi default template di `shared/story-templates.ts`.
5. Tambahkan kebutuhan konten ke `StoryContent` hanya bila benar-benar berlaku lintas template, lalu validasi melalui Zod. Untuk field persisten baru, tambahkan migration D1 dan wiring di `server/utils/story-content.ts`; jangan jalankan migration di luar alur rilis yang disetujui.
6. Pertahankan teks pengguna sebagai interpolasi Vue biasa. Jangan render teks cerita dengan `v-html`.
7. Gunakan stylesheet scoped pada layout atau komponen. Nama kelas template harus unik dan tidak mengubah precedence CSS template lain.
8. Periksa tampilan entrance, seluruh section, galeri, buku, penutup, dan kontrol musik pada layar kecil serta desktop. Hormati `prefers-reduced-motion`.

## Entrance dan dekorasi

`TemplateEntranceConfig` memilih gaya dan label tombol pembuka. `EntranceCover` mengambil konfigurasi tersebut dari registry metadata; interaksi pembuka membuka cerita dan memulai musik hanya jika lagu tersedia. Jangan memulai audio otomatis saat halaman dimuat.

`DecorativeLayer` adalah lapisan dekoratif bersama yang tersembunyi dari teknologi bantu. Efek dekorasi harus tetap non-interaktif dan berhenti saat reduced motion aktif.

## Kontrak audio

- `MusicEngine` mengelola satu elemen audio langsung untuk satu pengalaman cerita.
- `FloatingMusicPlayer` dan `MusicControlPanel` mengakses engine melalui `useStoryMusicEngine()`.
- URL HTTPS file audio langsung dapat diputar. Tautan berbagi Spotify, YouTube, dan SoundCloud tidak di-embed dan tidak diberi tautan keluar.
- Upload audio menggunakan `AudioField` dan endpoint `/api/uploads/audio`. Endpoint membutuhkan sesi akun, pembatasan laju, konfirmasi hak penggunaan, verifikasi byte/MIME, batas 20 MB, dan folder Cloudinary milik pemilik cerita.
- Jangan menaruh secret Cloudinary di klien. Gunakan respons endpoint yang telah divalidasi dan tampilkan kegagalan upload/pemutaran kepada pengguna.

## Validasi sebelum menggabungkan perubahan

- `pnpm.cmd test`
- `pnpm.cmd typecheck`
- Periksa hydration, konsol, permintaan jaringan, audio, fokus keyboard, dan reduced motion di browser.
- Uji tiap template setidaknya pada 320 px, 768 px, 1024 px, dan 1440 px; periksa overflow horizontal dan keterbacaan konten.
- Jalankan build melalui terminal Windows lokal yang digunakan untuk deployment. Jangan jalankan build bersamaan dengan preview yang mengunci `.output`.
