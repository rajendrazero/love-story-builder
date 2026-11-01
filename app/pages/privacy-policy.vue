<template>
  <main class="legal-page">
    <NuxtLink to="/" class="legal-back">← Kembali ke Selamanya</NuxtLink>
    <p class="legal-eyebrow">Informasi layanan</p>
    <h1>Kebijakan Privasi</h1>
    <p class="legal-intro">
      Kebijakan ini menjelaskan informasi yang diproses Selamanya saat kamu membuat akun,
      menyusun cerita, atau menggunakan fitur email dan unggah foto.
    </p>

    <section>
      <h2>Informasi yang kami proses</h2>
      <ul>
        <li>
          <strong>Informasi akun:</strong> alamat email, username, dan data yang diperlukan
          untuk masuk, menjaga sesi, serta mengirim verifikasi akun atau reset sandi.
        </li>
        <li>
          <strong>Konten:</strong> teks cerita, nama, tanggal, bab, tautan, foto, dan pengaturan
          yang kamu masukkan. Cerita yang diterbitkan dapat dilihat melalui tautan publiknya;
          cerita dengan sandi hanya dapat dibuka setelah sandi yang benar dimasukkan.
        </li>
        <li>
          <strong>Informasi operasional:</strong> request ID dan diagnostik terbatas untuk
          menjaga keamanan, membatasi penyalahgunaan, dan menangani kegagalan layanan.
        </li>
      </ul>
    </section>

    <section>
      <h2>Bagaimana informasi digunakan</h2>
      <p>
        Informasi digunakan untuk menyediakan akun dan sesi, menyimpan serta menampilkan
        cerita, mengirim email verifikasi dan reset sandi, melindungi layanan dari
        penyalahgunaan, dan memperbaiki masalah teknis. Kami tidak menggunakan data Google
        untuk iklan atau tujuan selain fungsi layanan yang kamu minta.
      </p>
    </section>

    <section>
      <h2>Layanan pihak ketiga dan Google</h2>
      <p>
        Layanan ini menggunakan Cloudflare Workers dan D1 untuk menjalankan aplikasi dan
        menyimpan data, Cloudinary untuk menyimpan foto yang diunggah, Google Gmail API untuk
        mengirim email layanan, dan Cloudflare Turnstile untuk pemeriksaan keamanan.
        Penyedia tersebut memproses informasi sesuai fungsi dan kebijakan privasinya.
      </p>
      <p>
        Jika Gmail API diaktifkan, akses Google digunakan terbatas untuk mengirim email
        verifikasi dan reset sandi melalui akun pengirim yang dikonfigurasi. Layanan tidak
        membaca kotak masuk, mengelola email, atau menggunakan data Google untuk iklan.
        Kredensial OAuth digunakan oleh server untuk meminta izin pengiriman email. Penggunaan
        dan transfer data yang diterima dari Google API mematuhi
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
        >Google API Services User Data Policy</a>,
        termasuk persyaratan Limited Use.
      </p>
      <p>
        Cerita dapat berisi tautan atau pemutar dari layanan lain. Saat kamu atau pengunjung
        membuka layanan tersebut, kebijakan penyedia itu yang berlaku.
      </p>
    </section>

    <section>
      <h2>Penyimpanan dan keamanan</h2>
      <p>
        Data akun dan cerita disimpan selama diperlukan untuk menyediakan layanan atau sampai
        konten terkait dihapus. Foto yang diunggah disimpan oleh Cloudinary. Kredensial email
        production disimpan sebagai secret Worker dan tidak dikirim ke browser. Kami memakai
        kontrol akses akun dan langkah keamanan yang wajar, tetapi tidak ada metode
        penyimpanan atau transmisi yang dapat dijamin sepenuhnya aman.
      </p>
      <p>
        Kamu dapat menghapus cerita dan draft milikmu dari halaman akun. Penghapusan dari
        sistem cadangan atau log milik penyedia infrastruktur dapat mengikuti jadwal retensi
        penyedia tersebut.
      </p>
    </section>

    <section>
      <h2>Cookie dan pilihanmu</h2>
      <p>
        Cookie sesi digunakan agar login dan fitur akun berfungsi. Kamu dapat keluar untuk
        mengakhiri sesi di perangkat. Jangan masukkan informasi yang tidak ingin dibagikan
        melalui cerita yang diterbitkan.
      </p>
    </section>

    <section>
      <h2>Perubahan dan pertanyaan</h2>
      <p>
        Kebijakan ini dapat diperbarui ketika fitur atau kewajiban layanan berubah. Jika ada
        pertanyaan atau permintaan terkait data, hubungi pengelola melalui alamat kontak resmi
        yang dicantumkan pada halaman aplikasi OAuth Selamanya.
      </p>
    </section>

    <NuxtLink class="legal-related-link" to="/terms">Baca Syarat dan Ketentuan →</NuxtLink>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Kebijakan Privasi — Selamanya',
  description: 'Kebijakan privasi Selamanya dan cara data akun, cerita, serta email diproses.',
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

ul {
  display: grid;
  gap: 0.75rem;
  padding-left: 1.25rem;
}

.legal-related-link {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 700;
}
</style>
