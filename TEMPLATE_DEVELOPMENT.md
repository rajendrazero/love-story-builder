# Panduan Pengembangan Template

Dokumen ini mencatat kontrak template cerita yang digunakan GALERRY saat ini. Pertahankan renderer sinkron dan stylesheet yang scoped; jangan memindahkan registry ke pemuatan malas tanpa bukti SSR, urutan CSS, dan tampilan tetap konsisten.

## Struktur saat ini

- `shared/story-templates.ts` menyimpan ID, metadata, fitur, konfigurasi entrance, serta skema kustomisasi template.
- `shared/schema/story.ts` memvalidasi konten cerita yang dipakai draft, publikasi, preview, dan renderer publik.
- `app/components/story-templates/registry.ts` menghubungkan setiap `TemplateRendererId` ke komponen layout Vue.
- `app/components/StoryExperience.vue` memilih layout dari registry dan menyediakan slot `hero`, `greeting`, `gallery`, `detail`, `book`, dan `finale`.
- `app/components/story-experience/` berisi section renderer dan interaksi bersama, termasuk entrance, dekorasi, serta audio.

Template yang terdaftar: `editorial-rose`, `midnight-cinema`, `botanical-journal`, `love-letter`, dan `memory-atlas`. Setiap layout boleh mengatur urutan atau komposisi slotnya sendiri; jangan memaksakan satu struktur visual untuk semua template.

## Menambahkan atau mengubah template

1. Tambahkan ID dan metadata ke `storyTemplates` di `shared/story-templates.ts`, termasuk kategori, fitur, warna, status, dan entrance.
2. Jika ada konten kustom, tambahkan skema yang ketat di `templateCustomizationSchemas`, kaitkan `customizationKey`, dan buat default yang valid. Hindari memasukkan data presentasi ke dalam field cerita umum.
3. Tambahkan renderer ke `TemplateRendererId`, buat komponen layout di `app/components/story-templates/layouts/`, lalu daftarkan di `registry.ts`. Registry harus tetap memenuhi `Record<TemplateRendererId, Component>`.
4. Gunakan slot pengalaman yang disediakan oleh `StoryExperience`. Tambahkan kebutuhan konten baru ke `StoryContent` hanya bila benar-benar berlaku lintas template, lalu validasi melalui Zod.
5. Pertahankan teks pengguna sebagai interpolasi Vue biasa. Jangan render teks cerita dengan `v-html`.
6. Gunakan stylesheet scoped pada layout atau komponen. Nama kelas template harus unik dan tidak mengubah precedence CSS template lain.
7. Periksa tampilan entrance, seluruh section, galeri, buku, penutup, dan kontrol musik pada layar kecil serta desktop. Hormati `prefers-reduced-motion`.

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
