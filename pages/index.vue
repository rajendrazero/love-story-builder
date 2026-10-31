<template>
  <main ref="page" class="home-page">
    <nav class="home-nav">
      <NuxtLink to="/" class="home-brand">selamanya<span>®</span></NuxtLink>
      <div class="home-nav-links">
        <a href="#fitur">Isi ceritamu</a>
        <NuxtLink to="/preview">Lihat contoh</NuxtLink>
        <NuxtLink to="/login">Masuk</NuxtLink>
        <NuxtLink to="/register">Daftar</NuxtLink>
        <NuxtLink to="/templates" class="home-nav-cta">Mulai bikin ↗</NuxtLink>
      </div>
      <div class="home-nav-mobile">
        <NuxtLink to="/preview">Preview</NuxtLink>
        <NuxtLink to="/login">Masuk</NuxtLink>
        <NuxtLink to="/register">Daftar</NuxtLink>
        <NuxtLink to="/templates" class="home-nav-cta">Bikin punyaku ↗</NuxtLink>
      </div>
    </nav>

    <section class="home-screen home-hero">
      <div class="hero-glow hero-glow-one" />
      <div class="hero-glow hero-glow-two" />
      <div class="home-hero-content">
        <div class="home-hero-copy">
          <span class="home-pill"><i /> bukan template biasa</span>
          <p class="home-kicker">Ruang kecil. Cerita paling kalian.</p>
          <h1>LOVE,<br>IN YOUR<br><em>own words.</em></h1>
          <p class="home-intro">Bikin halaman internet dari foto receh, cerita dalam, dan lagu yang cuma kalian berdua tahu.</p>
          <div class="home-actions">
            <NuxtLink to="/preview" class="button-primary">Intip hasil jadinya ↗</NuxtLink>
            <NuxtLink to="/templates" class="button-quiet">Bikin cerita kalian ↗</NuxtLink>
          </div>
        </div>
        <div class="home-hero-collage" aria-label="Kolase foto kenangan">
          <figure class="hero-photo hero-photo-main">
            <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1100&q=85" alt="Sepasang kekasih berbagi senja">
            <figcaption>sore favorit kita ♡</figcaption>
          </figure>
          <figure class="hero-photo hero-photo-small">
            <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=85" alt="Kencan kecil yang jadi kenangan">
          </figure>
          <span class="hero-note">made with<br>your memories ✳</span>
          <span class="hero-flower" aria-hidden="true">✳</span>
        </div>
        <span class="hero-index">01 / made of you two</span>
      </div>
    </section>

    <section id="fitur" class="home-screen home-features">
      <header class="feature-heading">
        <div>
          <p class="home-kicker">Buat yang personal, bukan yang sempurna</p>
          <h2>Foto blur pun punya <em>cerita.</em></h2>
        </div>
        <p class="feature-intro">Pilih foto, tulis kisahnya, lihat dulu hasilnya. Baru kalau sudah pas, terbitkan.</p>
      </header>
      <div class="feature-grid">
        <article class="feature-card feature-cover">
          <span class="feature-number">01 / pembuka</span>
          <div><h3>Foto favorit.<br>Judul kalian.</h3><span class="feature-script">itu udah cukup ♡</span></div>
          <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85" alt="" loading="lazy">
        </article>
        <article class="feature-card feature-gallery">
          <span class="feature-number">02 / galeri</span>
          <div><span class="feature-symbol">↗</span><h3>Scroll kenangan kalian.</h3></div>
        </article>
        <article class="feature-card feature-book">
          <span class="feature-number">03 / buku kecil</span>
          <div><span class="feature-symbol">✳</span><h3>Satu bab, satu rasa.</h3></div>
        </article>
        <article class="feature-card feature-note">
          <span class="feature-number">04 / kartu ucapan</span>
          <div><span class="feature-script">dear you,</span><h3>Tulis yang jarang kamu bilang.</h3></div>
        </article>
        <article class="feature-card feature-song">
          <span class="feature-number">05 / lagu kalian</span>
          <div><span class="feature-symbol">♫</span><h3>Kasih soundtrack ke ceritanya.</h3></div>
        </article>
        <article class="feature-card feature-share">
          <span class="feature-number">06 / cara berbagi</span>
          <div><span class="qr-mark" aria-hidden="true">▦</span><h3>Satu link. Satu QR. Jadi milik kalian.</h3></div>
        </article>
      </div>
      <div class="feature-ticker" aria-label="Foto favorit, inside jokes, lagu kalian, cerita nyata">
        <div class="ticker-track">
          <span v-for="(item, index) in tickerItems" :key="item">{{ item }} <b>{{ index % 2 ? '♡' : '✳' }}</b></span>
          <span v-for="(item, index) in tickerItems" :key="`repeat-${item}`" aria-hidden="true">{{ item }} <b>{{ index % 2 ? '♡' : '✳' }}</b></span>
        </div>
      </div>
    </section>

    <section class="home-screen home-cta">
      <div class="cta-glow" />
      <div class="cta-content">
        <div class="cta-copy">
          <p class="home-kicker">No design degree required</p>
          <h2>Internet, tapi rasanya <em>kalian banget.</em></h2>
          <p>Lihat contoh dulu. Kalau suka, ubah semuanya jadi cerita kalian. Tidak ada yang diterbitkan sebelum kamu bilang siap.</p>
          <div class="home-actions">
            <NuxtLink to="/preview" class="button-primary">Lihat pratinjau ↗</NuxtLink>
            <NuxtLink to="/templates" class="button-quiet">Mulai bikin cerita ↗</NuxtLink>
          </div>
        </div>
        <div class="cta-photo-wrap">
          <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=85" alt="Dua orang merayakan cerita bersama" loading="lazy">
          <span>buat & bagikan ✳</span>
        </div>
      </div>
      <footer class="home-footer">
        <span>selamanya<span class="brand-mark">®</span></span>
        <span>Dibuat dari banyak kenangan kecil.</span>
        <NuxtLink to="/preview">Preview template ↗</NuxtLink>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

useSeoMeta({
  title: 'Selamanya — Bikin Cerita Kalian',
  description: 'Ubah foto, cerita, dan lagu favorit jadi halaman digital yang personal. Lihat pratinjau tanpa mengisi form.',
})

const tickerItems = ['foto favorit', 'inside jokes', 'lagu kalian', 'cerita nyata', 'made by you']
const page = ref<HTMLElement | null>(null)
let motionMedia: gsap.MatchMedia | undefined

onMounted(() => {
  const root = page.value
  if (!root) return

  gsap.registerPlugin(ScrollTrigger)
  motionMedia = gsap.matchMedia(root)
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.home-hero-copy > *', { y: 22, duration: 0.7, stagger: 0.09 })
      .from('.home-hero-collage > *', { y: 18, rotate: '+=4', duration: 0.8, stagger: 0.1 }, 0.1)

    gsap.from('.feature-card', {
      y: 20,
      autoAlpha: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.home-features',
        start: 'top 75%',
        once: true,
      },
    })

    gsap.from('.cta-copy, .cta-photo-wrap', {
      y: 20,
      autoAlpha: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.home-cta',
        start: 'top 75%',
        once: true,
      },
    })

    const cleanupHandlers: Array<() => void> = []
    const cards = root.querySelectorAll<HTMLElement>('.feature-card')
    cards.forEach((card) => {
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const bounds = card.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / bounds.width - 0.5
        const y = (event.clientY - bounds.top) / bounds.height - 0.5
        gsap.to(card, {
          rotationY: x * 7,
          rotationX: y * -7,
          y: -4,
          transformPerspective: 900,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }
      const onPointerLeave = () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          y: 0,
          duration: 0.55,
          ease: 'elastic.out(1, 0.55)',
          overwrite: 'auto',
        })
      }

      card.addEventListener('pointermove', onPointerMove)
      card.addEventListener('pointerleave', onPointerLeave)
      cleanupHandlers.push(() => {
        card.removeEventListener('pointermove', onPointerMove)
        card.removeEventListener('pointerleave', onPointerLeave)
        gsap.killTweensOf(card)
      })
    })

    return () => cleanupHandlers.forEach(cleanup => cleanup())
  })
})

onBeforeUnmount(() => {
  motionMedia?.revert()
})
</script>

<style scoped>
.home-page {
  --page-pad: clamp(1rem, 5vw, 5rem);
  overflow: clip;
  background: #f7f4ed;
  scroll-snap-type: y mandatory;
}

.home-nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 30;
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem var(--page-pad);
  border-bottom: 1px solid rgb(32 29 40 / 8%);
  background: rgb(247 244 237 / 88%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: background 220ms ease, box-shadow 220ms ease;
}

.home-brand,
.home-footer > span:first-child {
  color: #201d28;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}

.home-brand span,
.brand-mark {
  color: #5045f5;
}

.home-nav-links,
.home-nav-mobile {
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 3vw, 2rem);
  font-size: 0.74rem;
}

.home-nav-links a,
.home-nav-mobile a,
.home-footer a {
  color: inherit;
  text-decoration: none;
}

.home-nav-mobile {
  display: none;
}

.home-nav-cta {
  border-radius: 999px;
  padding: 0.72rem 1rem;
  color: white !important;
  background: #5045f5;
}

.home-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100svh;
  min-height: 0;
  overflow: hidden;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.home-hero {
  display: grid;
  align-items: center;
  padding: 4.5rem var(--page-pad) 1.5rem;
  color: white;
  background: #5045f5;
}

.hero-glow,
.cta-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(5rem);
  pointer-events: none;
}

.hero-glow-one {
  top: 20%;
  left: -9rem;
  width: 25rem;
  height: 25rem;
  background: #756cfb;
}

.hero-glow-two {
  top: 27%;
  right: -5rem;
  width: 18rem;
  height: 18rem;
  background: #ff7968;
}

.home-hero-content {
  position: relative;
  display: grid;
  width: min(100%, 88rem);
  height: 100%;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: clamp(1rem, 4vw, 4rem);
  margin: 0 auto;
}

.home-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 46rem;
}

.home-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0.5rem 0.8rem;
  color: #201d28;
  background: #d8f36a;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transform: rotate(-2deg);
}

.home-pill i {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #5045f5;
}

.home-kicker {
  margin: clamp(0.7rem, 2svh, 1.2rem) 0 0;
  color: rgb(255 255 255 / 68%);
  font-size: clamp(0.55rem, 0.9vw, 0.72rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-hero h1 {
  margin: clamp(0.7rem, 2svh, 1.3rem) 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.65rem, 8.3vw, 7.6rem);
  font-weight: 700;
  letter-spacing: -0.085em;
  line-height: 0.84;
}

.home-hero h1 em,
.feature-heading h2 em,
.cta-copy h2 em {
  color: #d8f36a;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
}

.home-intro,
.cta-copy > p:not(.home-kicker) {
  max-width: 32rem;
  margin: clamp(0.7rem, 2svh, 1.3rem) 0 0;
  color: rgb(255 255 255 / 80%);
  font-size: clamp(0.7rem, 1.1vw, 0.95rem);
  line-height: 1.65;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: clamp(0.8rem, 2.4svh, 1.5rem);
}

.button-primary,
.button-quiet {
  display: inline-flex;
  min-height: 2.7rem;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: clamp(0.62rem, 0.9vw, 0.76rem);
  text-decoration: none;
  transition: transform 220ms cubic-bezier(0.2, 0.75, 0.3, 1), background 180ms ease, box-shadow 180ms ease;
}

.button-primary {
  color: #201d28;
  background: #d8f36a;
  font-weight: 700;
}

.button-quiet {
  border-color: rgb(255 255 255 / 45%);
  color: white;
  background: rgb(255 255 255 / 4%);
}

.button-primary:hover,
.button-quiet:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 0.6rem 1.5rem rgb(20 14 56 / 18%);
}

.home-hero-collage {
  position: relative;
  width: 100%;
  height: min(70svh, 43rem);
  max-height: 100%;
}

.hero-photo {
  position: absolute;
  margin: 0;
  background: white;
  box-shadow: 0 1.8rem 4rem rgb(20 14 56 / 35%);
}

.hero-photo-main {
  top: 6%;
  left: 8%;
  z-index: 1;
  width: 68%;
  height: 88%;
  padding: 0.6rem 0.6rem 2.7rem;
  transform: rotate(-7deg);
}

.hero-photo-main img,
.hero-photo-small img,
.cta-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-photo-main figcaption {
  position: absolute;
  bottom: 0.55rem;
  left: 0.9rem;
  color: #201d28;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(0.9rem, 1.7vw, 1.3rem);
  font-style: italic;
}

.hero-photo-small {
  top: 15%;
  right: 2%;
  z-index: 2;
  width: 40%;
  height: 52%;
  border: 0.4rem solid #d8f36a;
  border-radius: 1.5rem;
  padding: 0.35rem;
  background: #ffd66e;
  transform: rotate(7deg);
}

.hero-photo-small img {
  border-radius: 1rem;
}

.hero-note {
  position: absolute;
  right: 2%;
  bottom: 7%;
  z-index: 3;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  color: #201d28;
  background: #ff7968;
  box-shadow: 0 0.6rem 1.5rem rgb(20 14 56 / 20%);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: uppercase;
  transform: rotate(-6deg);
}

.hero-flower {
  position: absolute;
  bottom: 12%;
  left: 2%;
  color: #d8f36a;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(3rem, 6vw, 6rem);
  transform: rotate(12deg);
}

.hero-index {
  position: absolute;
  right: 0;
  bottom: 0;
  color: rgb(255 255 255 / 58%);
  font-size: 0.58rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.home-features {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(4.5rem, 9svh, 6.5rem) var(--page-pad) clamp(1rem, 3svh, 2rem);
  background: #f7f4ed;
}

.feature-heading {
  display: flex;
  min-height: 5rem;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}

.feature-heading .home-kicker {
  margin: 0;
  color: #5045f5;
}

.feature-heading h2,
.cta-copy h2 {
  max-width: 16ch;
  margin: 0.4rem 0 0;
  color: #201d28;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.7rem, 4vw, 3.8rem);
  font-weight: 700;
  letter-spacing: -0.065em;
  line-height: 0.96;
}

.feature-heading h2 em {
  color: #5045f5;
}

.feature-intro {
  max-width: 25rem;
  margin: 0 0 0.15rem;
  color: rgb(32 29 40 / 70%);
  font-size: clamp(0.68rem, 1vw, 0.86rem);
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(0.5rem, 1.3vw, 1rem);
  margin-block: clamp(0.6rem, 1.5svh, 1.2rem);
}

.feature-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  transform-style: preserve-3d;
  border-radius: clamp(0.9rem, 2vw, 1.5rem);
  padding: clamp(0.65rem, 1.8vw, 1.5rem);
}

.feature-number {
  position: relative;
  z-index: 2;
  font-size: clamp(0.48rem, 0.72vw, 0.65rem);
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.feature-card h3 {
  position: relative;
  z-index: 2;
  max-width: 19ch;
  margin: 0.3rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.92rem, 1.8vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
}

.feature-cover {
  color: #201d28;
  background: #ffcfbe;
}

.feature-cover img {
  position: absolute;
  right: -8%;
  bottom: -16%;
  width: 52%;
  height: 82%;
  border: 0.4rem solid rgb(255 255 255 / 75%);
  border-radius: 50% 50% 0 0;
  object-fit: cover;
  transform: rotate(-8deg);
}

.feature-cover > div {
  position: relative;
  z-index: 2;
}

.feature-script {
  display: inline-block;
  margin-top: 0.6rem;
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
  background: #d8f36a;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(0.8rem, 1.3vw, 1.1rem);
  font-style: italic;
  transform: rotate(-4deg);
}

.feature-gallery {
  color: #201d28;
  background: #ffd66e;
}

.feature-book {
  color: white;
  background: #5045f5;
}

.feature-note {
  color: #201d28;
  background: #dff2e1;
}

.feature-note .feature-script {
  margin: 0;
  padding: 0;
  color: #5045f5;
  background: transparent;
  font-size: clamp(1.5rem, 3vw, 2.8rem);
  transform: none;
}

.feature-song {
  color: #201d28;
  background: #f0e5f9;
}

.feature-share {
  color: #201d28;
  background: #ff7968;
}

.feature-symbol {
  display: inline-block;
  color: #5045f5;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.4rem, 3vw, 3rem);
}

.feature-book .feature-symbol {
  color: #d8f36a;
}

.qr-mark {
  display: inline-grid;
  width: clamp(1.25rem, 3vw, 2.7rem);
  aspect-ratio: 1;
  place-items: center;
  margin-bottom: 0.25rem;
  border: 1px solid rgb(32 29 40 / 45%);
  border-radius: 0.35rem;
  background: #f7f4ed;
  font-size: clamp(1.1rem, 2.5vw, 2.2rem);
  line-height: 1;
}

.feature-ticker {
  display: block;
  min-height: 1.5rem;
  overflow: hidden;
  color: #201d28;
  font-size: clamp(0.45rem, 0.75vw, 0.62rem);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.feature-ticker .ticker-track {
  display: flex;
  width: max-content;
  min-height: inherit;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.5rem);
}

.feature-ticker .ticker-track > span {
  flex: 0 0 auto;
}

.feature-ticker b {
  margin-left: 0.3rem;
  color: #5045f5;
}

.home-cta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(5rem, 12svh, 8rem) var(--page-pad) 1.25rem;
  color: #f7f4ed;
  background: #201d28;
}

.cta-glow {
  top: -9rem;
  right: -7rem;
  width: 34rem;
  height: 34rem;
  background: rgb(80 69 245 / 48%);
}

.cta-content {
  position: relative;
  display: grid;
  width: min(100%, 88rem);
  min-height: 0;
  flex: 1;
  grid-template-columns: 1fr 0.9fr;
  align-items: center;
  gap: clamp(1rem, 6vw, 6rem);
  margin: 0 auto;
}

.cta-copy .home-kicker {
  color: #d8f36a;
}

.cta-copy h2 {
  max-width: 12ch;
  color: #f7f4ed;
  font-size: clamp(2.1rem, 5.2vw, 5.8rem);
}

.cta-copy h2 em {
  color: #ff7968;
}

.cta-copy > p:not(.home-kicker) {
  color: rgb(255 255 255 / 68%);
}

.cta-photo-wrap {
  position: relative;
  width: min(100%, 30rem);
  height: min(65svh, 37rem);
  justify-self: center;
  border: 0.55rem solid #f7f4ed;
  border-radius: 1.4rem;
  padding: 0.3rem;
  background: #f7f4ed;
  box-shadow: 0 2rem 5rem rgb(0 0 0 / 35%);
  transform: rotate(4deg);
}

.cta-photo-wrap img {
  border-radius: 1rem;
}

.cta-photo-wrap span {
  position: absolute;
  right: -1rem;
  bottom: 1rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  color: #201d28;
  background: #ffd66e;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(0.9rem, 1.5vw, 1.3rem);
  font-style: italic;
  transform: rotate(-7deg);
}

.home-footer {
  position: relative;
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: rgb(255 255 255 / 65%);
  font-size: clamp(0.55rem, 0.8vw, 0.68rem);
}

.home-footer > span:first-child {
  color: #f7f4ed;
}

@media (max-width: 700px) {
  .home-nav {
    min-height: 3.7rem;
    padding-block: 0.4rem;
  }

  .home-nav-links {
    display: none;
  }

  .home-nav-mobile {
    display: flex;
    gap: 0.7rem;
    font-size: 0.65rem;
  }

  .home-nav-cta {
    padding: 0.6rem 0.75rem;
  }

  .home-hero {
    padding: 4rem 1rem 1rem;
  }

  .home-hero-content {
    grid-template-columns: 1.1fr 0.9fr;
    gap: 0.5rem;
  }

  .home-pill {
    gap: 0.3rem;
    padding: 0.38rem 0.55rem;
    font-size: 0.47rem;
    letter-spacing: 0.08em;
  }

  .home-kicker {
    font-size: 0.52rem;
    letter-spacing: 0.11em;
  }

  .home-hero h1 {
    font-size: clamp(2.35rem, 11vw, 4.5rem);
    letter-spacing: -0.09em;
  }

  .home-intro {
    font-size: clamp(0.62rem, 2.5vw, 0.78rem);
    line-height: 1.5;
  }

  .home-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .button-primary,
  .button-quiet {
    min-height: 2.2rem;
    padding: 0.55rem 0.7rem;
    font-size: 0.58rem;
  }

  .home-hero-collage {
    height: min(56svh, 33rem);
  }

  .hero-photo-main {
    top: 13%;
    left: 0;
    width: 82%;
    height: 72%;
    padding: 0.35rem 0.35rem 2rem;
  }

  .hero-photo-main figcaption {
    bottom: 0.35rem;
    left: 0.45rem;
    font-size: clamp(0.64rem, 2.7vw, 0.9rem);
  }

  .hero-photo-small {
    top: 22%;
    right: -2%;
    width: 60%;
    height: 43%;
    border-width: 0.25rem;
    border-radius: 0.8rem;
    padding: 0.2rem;
  }

  .hero-photo-small img {
    border-radius: 0.55rem;
  }

  .hero-note {
    right: -4%;
    bottom: 12%;
    padding: 0.5rem 0.6rem;
    font-size: 0.48rem;
  }

  .hero-flower {
    bottom: 9%;
    left: -6%;
    font-size: 2.5rem;
  }

  .hero-index {
    display: none;
  }

  .home-features {
    padding: 4.1rem 0.85rem 0.7rem;
  }

  .feature-heading {
    min-height: 0;
    align-items: start;
    gap: 0.4rem;
  }

  .feature-heading .home-kicker {
    margin: 0;
    font-size: 0.48rem;
  }

  .feature-heading h2 {
    max-width: 18ch;
    font-size: clamp(1.4rem, 6.2vw, 2.2rem);
  }

  .feature-intro {
    display: none;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-block: 0.55rem;
  }

  .feature-card {
    border-radius: 0.85rem;
    padding: clamp(0.5rem, 2.2vw, 0.8rem);
  }

  .feature-number {
    font-size: clamp(0.42rem, 1.65vw, 0.58rem);
    letter-spacing: 0.08em;
  }

  .feature-card h3 {
    max-width: 17ch;
    font-size: clamp(0.76rem, 3.3vw, 1.05rem);
  }

  .feature-cover img {
    right: -12%;
    bottom: -17%;
    width: 46%;
    height: 78%;
    border-width: 0.25rem;
  }

  .feature-script {
    margin-top: 0.35rem;
    padding: 0.25rem 0.4rem;
    font-size: clamp(0.63rem, 2.7vw, 0.85rem);
  }

  .feature-note .feature-script {
    font-size: clamp(1.2rem, 5vw, 1.8rem);
  }

  .feature-ticker {
    min-height: 1.2rem;
    font-size: clamp(0.38rem, 1.45vw, 0.5rem);
    letter-spacing: 0.05em;
  }

  .feature-ticker .ticker-track {
    gap: 0.8rem;
  }

  .feature-ticker b {
    margin-left: 0.12rem;
  }

  .home-cta {
    padding: 4.5rem 1rem 0.75rem;
  }

  .cta-content {
    grid-template-columns: 1.1fr 0.9fr;
    gap: 0.6rem;
  }

  .cta-copy h2 {
    font-size: clamp(1.8rem, 8vw, 3.2rem);
  }

  .cta-copy > p:not(.home-kicker) {
    font-size: clamp(0.62rem, 2.5vw, 0.78rem);
    line-height: 1.5;
  }

  .cta-copy .home-actions {
    align-items: flex-start;
  }

  .cta-photo-wrap {
    height: min(53svh, 30rem);
    border-width: 0.35rem;
    border-radius: 0.8rem;
  }

  .cta-photo-wrap img {
    border-radius: 0.55rem;
  }

  .cta-photo-wrap span {
    right: -0.65rem;
    bottom: 0.55rem;
    padding: 0.5rem 0.65rem;
    font-size: 0.8rem;
  }

  .home-footer {
    min-height: 2.2rem;
    gap: 0.4rem;
    font-size: 0.48rem;
  }

  .home-footer > span:first-child {
    font-size: 0.8rem;
  }
}

@media (max-width: 360px) {
  .home-nav-mobile {
    gap: 0.4rem;
    font-size: 0.58rem;
  }

  .home-nav-cta {
    padding-inline: 0.55rem;
  }

  .home-hero h1 {
    font-size: 2.25rem;
  }

  .home-intro {
    font-size: 0.58rem;
  }

  .button-primary,
  .button-quiet {
    min-height: 2rem;
    font-size: 0.52rem;
  }

  .feature-heading h2 {
    font-size: 1.32rem;
  }

  .feature-card h3 {
    font-size: 0.7rem;
  }

  .feature-ticker .ticker-track > span:nth-child(5),
  .feature-ticker .ticker-track > span:nth-child(10) {
    display: none;
  }

  .cta-copy h2 {
    font-size: 1.65rem;
  }

  .home-footer {
    font-size: 0.42rem;
  }
}

@media (max-height: 600px) {
  .home-hero {
    padding-top: 3.8rem;
    padding-bottom: 0.6rem;
  }

  .home-pill {
    padding-block: 0.32rem;
  }

  .home-hero h1 {
    font-size: clamp(2.2rem, 7vw, 4.8rem);
  }

  .home-intro,
  .cta-copy > p:not(.home-kicker) {
    margin-top: 0.5rem;
    font-size: 0.68rem;
  }

  .home-actions {
    margin-top: 0.6rem;
  }

  .button-primary,
  .button-quiet {
    min-height: 2.15rem;
  }

  .home-hero-collage {
    height: 61svh;
  }

  .home-features {
    padding-top: 3.8rem;
    padding-bottom: 0.5rem;
  }

  .feature-grid {
    margin-block: 0.35rem;
  }

  .home-cta {
    padding-top: 4rem;
    padding-bottom: 0.6rem;
  }

  .cta-photo-wrap {
    height: 54svh;
  }
}

@media (min-width: 901px) and (max-height: 820px) {
  .home-page {
    scroll-snap-type: y proximity;
  }

  .home-screen {
    height: auto;
    min-height: 100svh;
  }

  .home-hero {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .home-hero-content {
    min-height: calc(100svh - 5rem);
  }

  .home-hero h1 {
    font-size: clamp(4rem, 7.2vw, 6.25rem);
  }

  .home-hero-collage {
    height: min(62svh, 34rem);
  }

  .home-features {
    padding-top: 4.1rem;
    padding-bottom: 1rem;
  }

  .feature-heading {
    min-height: 4.5rem;
    gap: clamp(1rem, 4vw, 3rem);
  }

  .feature-heading h2 {
    font-size: clamp(1.8rem, 3.2vw, 3rem);
  }

  .feature-intro {
    max-width: 21rem;
  }

  .feature-grid {
    min-height: 19rem;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    margin-block: 0.8rem;
  }

  .feature-card h3 {
    font-size: clamp(1rem, 1.55vw, 1.45rem);
  }

  .home-cta {
    padding-top: 4.5rem;
    padding-bottom: 1rem;
  }

  .cta-photo-wrap {
    height: min(58svh, 30rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page {
    scroll-snap-type: y proximity;
  }

  .button-primary,
  .button-quiet {
    transition: none;
  }
}
</style>
