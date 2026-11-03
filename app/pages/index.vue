<template>
  <main id="main-content" ref="page" tabindex="-1" class="home-page">
    <section class="home-screen home-hero">
      <div class="hero-glow hero-glow-one" />
      <div class="hero-glow hero-glow-two" />
      <div class="home-hero-content">
        <div class="home-hero-copy">
          <p class="home-kicker">SELAMANYA · A PLACE FOR YOUR STORY</p>
          <h1>Yang kecil-kecil,<br><em>jadi selamanya.</em></h1>
          <p class="home-intro">Foto, pesan, dan lagu kalian—dirangkai jadi satu halaman yang terasa seperti kalian.</p>
          <div class="home-actions">
            <NuxtLink to="/templates" class="button-primary">Mulai cerita ↗</NuxtLink>
            <NuxtLink to="/preview" class="button-quiet">Lihat contoh ↓</NuxtLink>
          </div>
        </div>
        <div
          class="home-hero-collage"
          :class="{ 'home-hero-3d-ready': sceneReady }"
          role="img"
          aria-label="Ilustrasi tiga dimensi album cerita Selamanya"
        >
          <div class="hero-scene-halo" />
          <div class="hero-scene-fallback" aria-hidden="true">
            <figure class="hero-fallback-card hero-fallback-card-secondary">
              <img :src="heroOne" alt="">
              <figcaption>little moments</figcaption>
            </figure>
            <figure class="hero-fallback-card hero-fallback-card-main">
              <img :src="heroTwo" alt="">
              <figcaption>our story ♡</figcaption>
            </figure>
          </div>
          <ClientOnly>
            <HomeHeroScene @ready="sceneReady = true" />
          </ClientOnly>
        </div>
      </div>
    </section>

    <section id="fitur" class="home-screen home-features">
      <header class="feature-heading">
        <div>
          <p class="home-kicker">DIBUAT DARI YANG NYATA</p>
          <h2>Kenangan kecil.<br><em>Rasa yang besar.</em></h2>
        </div>
        <p class="feature-intro">Pilih suasana. Isi cerita. Bagikan saat siap.</p>
      </header>
      <div class="feature-grid">
        <article class="feature-card feature-cover">
          <div><h3>Foto favorit.<br>Judul kalian.</h3><span class="feature-script">itu udah cukup ♡</span></div>
          <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85" alt="" loading="lazy">
        </article>
        <article class="feature-card feature-gallery">
          <div><span class="feature-symbol">↗</span><h3>Scroll kenangan kalian.</h3></div>
        </article>
        <article class="feature-card feature-book">
          <div><span class="feature-symbol">✳</span><h3>Satu bab, satu rasa.</h3></div>
        </article>
        <article class="feature-card feature-note">
          <div><span class="feature-script">dear you,</span><h3>Tulis yang jarang kamu bilang.</h3></div>
        </article>
        <article class="feature-card feature-song">
          <div><span class="feature-symbol">♫</span><h3>Kasih soundtrack ke ceritanya.</h3></div>
        </article>
        <article class="feature-card feature-share">
          <div><span class="qr-mark" aria-hidden="true">▦</span><h3>Satu link. Satu QR. Jadi milik kalian.</h3></div>
        </article>
      </div>
    </section>

    <section class="home-screen home-cta">
      <div class="cta-glow" />
      <div class="cta-content">
        <div class="cta-copy">
          <p class="home-kicker">PUNYA KALIAN, SEPENUHNYA</p>
          <h2>Satu link.<br><em>Seluruh cerita.</em></h2>
          <p>Rangkai sesuka hati. Terbitkan hanya saat kamu siap.</p>
          <div class="home-actions">
            <NuxtLink to="/templates" class="button-primary">Buat cerita ↗</NuxtLink>
            <NuxtLink to="/preview" class="button-quiet">Lihat contoh ↗</NuxtLink>
          </div>
        </div>
        <div class="cta-photo-wrap">
          <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=85" alt="Dua orang merayakan cerita bersama" loading="lazy">
          <span>buat & bagikan ✳</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import heroOne from '../assets/img/hero1.jpg'
import heroTwo from '../assets/img/hero2.jpg'

const HomeHeroScene = defineAsyncComponent(() => import('../components/HomeHeroScene.vue'))
const sceneReady = ref(false)

useSeoMeta({
  title: 'Selamanya — Bikin Cerita Kalian',
  description: 'Ubah foto, cerita, dan lagu favorit jadi halaman digital yang personal. Lihat pratinjau tanpa mengisi form.',
  ogTitle: 'Selamanya — Bikin Cerita Kalian',
  ogDescription: 'Ubah foto, cerita, dan lagu favorit jadi halaman digital yang personal. Lihat pratinjau tanpa mengisi form.',
  ogType: 'website',
})

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

    const featureSection = root.querySelector<HTMLElement>('.home-features')
    const ctaSection = root.querySelector<HTMLElement>('.home-cta')
    const heroCopy = root.querySelector<HTMLElement>('.home-hero-copy')
    const heroCollage = root.querySelector<HTMLElement>('.home-hero-collage')
    const heroGlows = root.querySelectorAll<HTMLElement>('.hero-glow')
    const ctaGlow = root.querySelector<HTMLElement>('.cta-glow')
    const featureHeading = root.querySelector<HTMLElement>('.feature-heading')
    const featureGrid = root.querySelector<HTMLElement>('.feature-grid')

    const navigationOffset = () => {
      return document.querySelector('.site-nav-shell')?.getBoundingClientRect().height ?? 68
    }

    if (featureSection && ctaSection && heroCopy && heroCollage && featureHeading && featureGrid) {
      gsap.timeline({
        scrollTrigger: {
          trigger: featureSection,
          start: 'top bottom',
          end: () => `top top+=${navigationOffset()}`,
          scrub: 0.35,
        },
      })
        .to(heroCopy, { yPercent: -15, scale: 0.94, opacity: 0.68, ease: 'none' }, 0)
        .to(heroCollage, { yPercent: 18, rotate: -4, ease: 'none' }, 0)
        .to(heroGlows, { yPercent: 32, ease: 'none' }, 0)

      gsap.timeline({
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top bottom',
          end: () => `top top+=${navigationOffset()}`,
          scrub: 0.35,
        },
      })
        .to(featureHeading, { yPercent: -8, opacity: 0.76, ease: 'none' }, 0)
        .to(featureGrid, { yPercent: -5, scale: 0.97, opacity: 0.76, ease: 'none' }, 0)
      if (ctaGlow) {
        gsap.to(ctaGlow, {
          yPercent: -22,
          xPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: ctaSection,
            start: 'top bottom',
            end: () => `top top+=${navigationOffset()}`,
            scrub: 0.45,
          },
        })
      }
    }

    const cleanupHandlers: Array<() => void> = []
    const cards = root.querySelectorAll<HTMLElement>('.feature-card')
    cards.forEach((card) => {
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.3, ease: 'power2.out' })
      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.3, ease: 'power2.out' })
      const liftTo = gsap.quickTo(card, 'y', { duration: 0.3, ease: 'power2.out' })
      const onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const bounds = card.getBoundingClientRect()
        if (bounds.width === 0 || bounds.height === 0) return
        const x = (event.clientX - bounds.left) / bounds.width - 0.5
        const y = (event.clientY - bounds.top) / bounds.height - 0.5
        rotateYTo(x * 7)
        rotateXTo(y * -7)
        liftTo(-4)
      }
      const onPointerLeave = () => {
        rotateYTo(0)
        rotateXTo(0)
        liftTo(0)
      }

      card.addEventListener('pointermove', onPointerMove)
      card.addEventListener('pointerleave', onPointerLeave)
      cleanupHandlers.push(() => {
        card.removeEventListener('pointermove', onPointerMove)
        card.removeEventListener('pointerleave', onPointerLeave)
        gsap.killTweensOf(card)
      })
    })

    return () => {
      cleanupHandlers.forEach(cleanup => cleanup())
    }
  })

  nextTick(() => ScrollTrigger.refresh())
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

.home-footer > span:first-child {
  color: #201d28;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}

.brand-mark {
  color: #5045f5;
}

.home-footer a {
  color: inherit;
  text-decoration: none;
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

.home-page {
  --page-pad: clamp(1.25rem, 7vw, 7.5rem);
  scroll-snap-type: y proximity;
}

.home-screen {
  height: auto;
  min-height: 100svh;
  scroll-snap-stop: normal;
  overflow: clip;
}

.home-hero {
  min-height: 100svh;
  padding: clamp(5.5rem, 11svh, 8rem) var(--page-pad) clamp(2rem, 5svh, 4rem);
  background:
    radial-gradient(ellipse at 82% 18%, rgb(255 214 110 / 26%), transparent 26rem),
    radial-gradient(ellipse at 88% 82%, rgb(255 121 104 / 38%), transparent 30rem),
    #5045f5;
}

.home-hero-content {
  min-height: calc(100svh - 12rem);
  grid-template-columns: minmax(0, 1.04fr) minmax(20rem, 0.96fr);
  gap: clamp(1.5rem, 5vw, 5rem);
}

.home-kicker {
  margin: 0;
  color: var(--brand-lime);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.home-hero h1 {
  max-width: 11ch;
  margin-top: 1.2rem;
  font-size: clamp(3.3rem, 6.7vw, 7.25rem);
  letter-spacing: -0.075em;
  line-height: 0.9;
}

.home-intro {
  max-width: 29rem;
  margin-top: 1.5rem;
  font-size: clamp(0.94rem, 1.3vw, 1.1rem);
  line-height: 1.7;
}

.home-actions {
  gap: 0.8rem;
  margin-top: 2rem;
}

.button-primary,
.button-quiet {
  min-height: 3rem;
  padding-inline: 1.25rem;
  font-size: 0.78rem;
}

.button-primary:hover,
.button-quiet:hover {
  transform: translateY(-3px) rotate(-1deg);
}

.home-hero-collage {
  width: 100%;
  height: min(74svh, 47rem);
  min-height: 26rem;
  overflow: visible;
  isolation: isolate;
}

.hero-scene-halo {
  position: absolute;
  inset: 8%;
  z-index: -1;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 216 185 / 78%), rgb(216 243 106 / 12%) 54%, transparent 72%);
  filter: blur(0.3rem);
}

.hero-scene-fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 48% 52% 43% 57% / 54% 46% 54% 46%;
  background:
    radial-gradient(circle at 30% 24%, rgb(255 255 255 / 54%) 0 0.4%, transparent 0.55%),
    radial-gradient(ellipse at 50% 50%, rgb(201 196 255 / 24%), transparent 68%);
}

.hero-fallback-card {
  position: absolute;
  display: grid;
  margin: 0;
  border: 0.55rem solid #fffaf3;
  border-radius: 0.35rem;
  padding: 0.65rem 0.65rem 2.45rem;
  color: #fffaf3;
  box-shadow: 0 2rem 5rem rgb(20 14 56 / 28%);
  background: #fffaf3;
}

.hero-fallback-card-secondary {
  top: 25%;
  left: 4%;
  width: 42%;
  height: 60%;
  padding-bottom: 2rem;
  transform: rotate(8deg);
}

.hero-fallback-card-main {
  top: 9%;
  right: 9%;
  width: 51%;
  height: 78%;
  transform: rotate(-7deg);
}

.hero-fallback-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-fallback-card figcaption {
  position: absolute;
  right: 0.65rem;
  bottom: 0.55rem;
  left: 0.65rem;
  color: #38314b;
  font-family: var(--font-family-display);
  font-size: clamp(0.75rem, 1.2vw, 1rem);
  font-style: italic;
  text-align: center;
}

.home-hero-scene {
  z-index: 2;
}

.hero-scene-fallback {
  opacity: 1;
  transition: opacity 400ms ease, transform 400ms ease, visibility 400ms ease;
}

.home-hero-3d-ready .hero-scene-fallback {
  visibility: hidden;
  opacity: 0;
  transform: scale(0.96);
}

.hero-note {
  right: 1%;
  bottom: 9%;
  z-index: 3;
  border: 1px solid rgb(32 29 40 / 8%);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  color: var(--brand-ink);
  background: var(--brand-lime);
  box-shadow: 0 0.8rem 2rem rgb(20 14 56 / 18%);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  transform: rotate(-5deg);
}

.hero-flower {
  bottom: 11%;
  left: 1%;
  z-index: 3;
  color: #fffaf3;
}

.home-features {
  height: auto;
  min-height: 100svh;
  gap: clamp(1.5rem, 4svh, 3rem);
  padding-block: clamp(5rem, 10svh, 7rem) clamp(2rem, 5svh, 4rem);
}

.feature-heading h2 {
  max-width: 18ch;
}

.feature-grid {
  min-height: 24rem;
  flex: initial;
  grid-auto-rows: minmax(11rem, auto);
}

.feature-card {
  min-height: 11rem;
  transition: box-shadow 220ms var(--motion-ease-standard);
}

.feature-card:hover {
  box-shadow: 0 1.2rem 2.4rem rgb(32 29 40 / 14%);
}

.home-cta {
  height: auto;
  min-height: 100svh;
  padding-block: clamp(5rem, 11svh, 8rem) 1.5rem;
}

.cta-content {
  min-height: 32rem;
}

.cta-photo-wrap {
  transition: transform 450ms var(--motion-ease-standard);
}

.cta-photo-wrap:hover {
  transform: rotate(1deg) translateY(-0.3rem);
}

.home-footer {
  min-height: 3.5rem;
  flex-wrap: wrap;
}

@media (max-width: 959px) {
  .home-hero {
    min-height: auto;
    padding: 6rem 1.25rem 2rem;
  }

  .home-hero-content {
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.7rem;
  }

  .home-hero-copy {
    max-width: 40rem;
  }

  .home-hero h1 {
    max-width: 12ch;
    margin-top: 0.85rem;
    font-size: clamp(3rem, 11.5vw, 5.3rem);
  }

  .home-intro {
    max-width: 32rem;
    margin-top: 0.9rem;
    font-size: 0.94rem;
  }

  .home-actions {
    flex-direction: row;
    align-items: center;
    gap: 0.65rem;
    margin-top: 1.2rem;
  }

  .button-primary,
  .button-quiet {
    min-height: 2.9rem;
    padding-inline: 0.95rem;
    font-size: 0.72rem;
  }

  .home-hero-collage {
    width: min(100%, 33rem);
    height: clamp(20rem, 62svh, 31rem);
    min-height: 20rem;
    justify-self: center;
  }

  .hero-note {
    right: 0;
    bottom: 8%;
  }

  .hero-flower {
    bottom: 9%;
    left: 0;
  }

  .home-features {
    min-height: 0;
    gap: 1.5rem;
    padding: 5rem 1.1rem 2rem;
  }

  .feature-heading {
    display: block;
  }

  .feature-heading h2 {
    font-size: clamp(2rem, 7vw, 3.2rem);
  }

  .feature-intro {
    display: block;
    margin: 0.9rem 0 0;
    font-size: 0.9rem;
  }

  .feature-grid {
    min-height: 0;
    grid-template-rows: none;
    grid-auto-rows: minmax(10rem, auto);
    gap: 0.65rem;
    margin: 0;
  }

  .feature-card {
    min-height: 10rem;
    border-radius: 1rem;
    padding: 1rem;
  }

  .feature-card h3 {
    font-size: clamp(0.95rem, 3.4vw, 1.25rem);
  }

  .home-cta {
    min-height: 0;
    gap: 3rem;
    padding: 5rem 1.2rem 1rem;
  }

  .cta-content {
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
  }

  .cta-copy h2 {
    font-size: clamp(2.8rem, 10vw, 4.5rem);
  }

  .cta-photo-wrap {
    width: min(88%, 25rem);
    height: clamp(16rem, 62vw, 23rem);
  }

  .home-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.65rem;
    padding-block: 1rem;
  }
}

@media (max-width: 380px) {
  .home-hero {
    padding-inline: 1rem;
  }

  .home-hero h1 {
    font-size: clamp(2.55rem, 11.5vw, 3rem);
  }

  .home-intro {
    font-size: 0.86rem;
  }

  .home-actions {
    flex-wrap: wrap;
  }

  .feature-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-card,
  .cta-photo-wrap,
  .hero-scene-fallback {
    transition: none;
  }

  .feature-card:hover,
  .cta-photo-wrap:hover {
    transform: none;
  }
}

@media (min-width: 960px) and (min-height: 720px) and (prefers-reduced-motion: no-preference) {
  .home-page {
    --home-stack-offset: 4.3rem;
  }

  .home-screen {
    position: sticky;
    top: var(--home-stack-offset);
    min-height: calc(100svh - var(--home-stack-offset));
  }

  .home-hero {
    z-index: 1;
    min-height: calc(100svh - var(--home-stack-offset));
    padding-top: clamp(4rem, 8svh, 6rem);
    padding-bottom: clamp(1.5rem, 3svh, 2.5rem);
  }

  .home-hero-content {
    min-height: calc(100svh - 11rem);
  }

  .home-hero h1 {
    max-width: 14ch;
    font-size: clamp(3.25rem, 5vw, 5.2rem);
    letter-spacing: -0.075em;
    line-height: 0.96;
  }

  .home-features {
    z-index: 2;
    min-height: calc(100svh - var(--home-stack-offset));
    border-radius: 1.75rem 1.75rem 0 0;
    box-shadow: 0 -1rem 3rem rgb(32 29 40 / 12%);
  }

  .home-cta {
    z-index: 3;
    min-height: calc(100svh - var(--home-stack-offset));
    border-radius: 1.75rem 1.75rem 0 0;
    box-shadow: 0 -1rem 3rem rgb(32 29 40 / 16%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scene-fallback {
    transition: none;
  }
}
</style>
