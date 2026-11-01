<template>
  <main id="main-content" tabindex="-1" class="legal-page">
    <NuxtLink to="/" class="legal-back">← Kembali ke Selamanya</NuxtLink>
    <p class="legal-eyebrow">Informasi layanan</p>
    <h1>Syarat dan Ketentuan</h1>
    <p class="legal-intro">
      Dengan membuat akun atau menggunakan Selamanya, kamu setuju menggunakan layanan
      secara bertanggung jawab sesuai ketentuan berikut.
    </p>

    <section>
      <h2>Akun dan keamanan</h2>
      <p>
        Kamu bertanggung jawab menjaga keamanan kredensial akun dan memastikan alamat email
        yang digunakan dapat menerima pesan verifikasi dan pemulihan. Berikan informasi yang
        benar dan segera amankan akun jika kamu menduga ada akses tanpa izin.
      </p>
    </section>

    <section>
      <h2>Konten dan hak penggunaan</h2>
      <p>
        Kamu tetap memiliki konten yang kamu buat. Dengan mengunggah atau mengirim konten,
        kamu menyatakan memiliki hak dan izin yang diperlukan, termasuk izin orang yang
        fotonya atau informasi pribadinya kamu bagikan. Kamu memberi Selamanya izin terbatas
        untuk menyimpan, memproses, dan menampilkan konten tersebut hanya sejauh diperlukan
        untuk menjalankan fitur yang kamu pilih.
      </p>
      <p>
        Kamu bertanggung jawab menentukan apakah cerita diterbitkan, dibagikan lewat tautan,
        atau dilindungi sandi. Siapa pun yang memperoleh tautan publik dapat melihat cerita
        yang diterbitkan; perlindungan sandi bukan pengganti kerahasiaan untuk informasi
        sensitif.
      </p>
    </section>

    <section>
      <h2>Penggunaan yang tidak diperbolehkan</h2>
      <p>
        Jangan menggunakan layanan untuk melanggar hukum atau hak orang lain, mengunggah
        konten tanpa izin, mencoba mengakses akun atau data orang lain, mengganggu layanan,
        atau menghindari kontrol keamanan dan batas penggunaan.
      </p>
    </section>

    <section>
      <h2>Layanan pihak ketiga</h2>
      <p>
        Email dikirim melalui provider yang dikonfigurasi dan foto disimpan melalui
        Cloudinary. Tautan atau pemutar eksternal tunduk pada syarat dan kebijakan penyedia
        masing-masing. Ketersediaan layanan pihak ketiga tidak berada sepenuhnya dalam
        kendali Selamanya.
      </p>
    </section>

    <section>
      <h2>Penghapusan dan ketersediaan</h2>
      <p>
        Kamu dapat menghapus cerita atau draft milikmu melalui halaman akun. Kami dapat
        membatasi atau menghentikan akses yang melanggar ketentuan, membahayakan pengguna,
        atau mengganggu layanan. Kami berupaya menjaga layanan tetap tersedia, tetapi tidak
        menjamin layanan selalu bebas gangguan atau kehilangan data.
      </p>
    </section>

    <section>
      <h2>Perubahan ketentuan</h2>
      <p>
        Ketentuan dapat diperbarui seiring perubahan layanan atau persyaratan yang berlaku.
        Penggunaan berkelanjutan setelah perubahan dipublikasikan berarti kamu menggunakan
        layanan berdasarkan ketentuan terbaru.
      </p>
    </section>

    <NuxtLink class="legal-related-link" to="/privacy-policy">Baca Kebijakan Privasi →</NuxtLink>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Syarat dan Ketentuan — Selamanya',
  description: 'Syarat penggunaan layanan Selamanya.',
  robots: 'index, follow',
})
</script>

<style scoped>
.legal-page {
  width: min(100% - 2rem, 54rem);
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 5rem) 0;
  color: #34313a;
  line-height: 1.75;
}

.legal-page a {
  color: #5045f5;
  text-underline-offset: 0.2em;
}

.legal-back {
  display: inline-block;
  margin-bottom: 2.5rem;
  font-size: 0.85rem;
  text-decoration: none;
}

.legal-eyebrow {
  margin: 0 0 0.5rem;
  color: #5045f5;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2 {
  color: #201d28;
  font-family: 'Space Grotesk', sans-serif;
  line-height: 1.2;
}

h1 {
  margin: 0;
  font-size: clamp(2.4rem, 8vw, 4.5rem);
  letter-spacing: -0.06em;
}

.legal-intro {
  max-width: 42rem;
  margin: 1.25rem 0 3rem;
  color: #66616d;
  font-size: 1.1rem;
}

section {
  margin: 2.5rem 0;
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
}

p {
  margin: 0.75rem 0;
}

.legal-related-link {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 700;
}
</style>
