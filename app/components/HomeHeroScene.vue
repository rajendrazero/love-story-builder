<template>
  <div ref="sceneHost" class="home-hero-scene" aria-hidden="true">
    <canvas ref="canvas" class="home-hero-scene-canvas" />
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import type * as THREE from 'three'
import heroOne from '../assets/img/hero1.jpg'
import heroTwo from '../assets/img/hero2.jpg'

const emit = defineEmits<{
  ready: []
}>()

const sceneHost = useTemplateRef<HTMLDivElement>('sceneHost')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined
let motionMedia: gsap.MatchMedia | undefined
let ambientMotion: gsap.core.Timeline | undefined
let stage: THREE.Group | undefined
let sceneVisible = false
let cleanupScene: (() => void) | undefined
let idleCallbackId: number | undefined
let fallbackTimer: number | undefined
let sceneDisposed = false

function renderScene() {
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function updateRendering() {
  if (!renderer) return
  const shouldAnimate = sceneVisible
    && document.visibilityState === 'visible'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (shouldAnimate) {
    ambientMotion?.play()
    renderer.setAnimationLoop(renderScene)
  } else {
    ambientMotion?.pause()
    renderer.setAnimationLoop(null)
    renderScene()
  }
}

function createMemoryTexture(three: typeof import('three'), photo?: HTMLImageElement) {
  const artwork = document.createElement('canvas')
  artwork.width = 512
  artwork.height = 640
  const context = artwork.getContext('2d')
  if (!context) return null

  context.fillStyle = '#fff9f0'
  context.fillRect(0, 0, artwork.width, artwork.height)

  if (photo && photo.naturalWidth > 0 && photo.naturalHeight > 0) {
    const sourceRatio = photo.naturalWidth / photo.naturalHeight
    const targetRatio = 448 / 432
    const sourceWidth = sourceRatio > targetRatio ? photo.naturalHeight * targetRatio : photo.naturalWidth
    const sourceHeight = sourceRatio > targetRatio ? photo.naturalHeight : photo.naturalWidth / targetRatio
    const sourceX = (photo.naturalWidth - sourceWidth) / 2
    const sourceY = (photo.naturalHeight - sourceHeight) / 2
    context.drawImage(photo, sourceX, sourceY, sourceWidth, sourceHeight, 32, 32, 448, 432)
  } else {
    const sky = context.createLinearGradient(0, 50, 0, 470)
    sky.addColorStop(0, '#f8aeaa')
    sky.addColorStop(0.55, '#f9d1a2')
    sky.addColorStop(1, '#7f72bd')
    context.fillStyle = sky
    context.fillRect(32, 32, 448, 432)

    context.fillStyle = '#ffe697'
    context.beginPath()
    context.arc(350, 155, 54, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#b77f91'
    context.beginPath()
    context.moveTo(32, 390)
    context.bezierCurveTo(120, 280, 180, 335, 248, 360)
    context.bezierCurveTo(326, 255, 390, 285, 480, 360)
    context.lineTo(480, 464)
    context.lineTo(32, 464)
    context.closePath()
    context.fill()

    context.fillStyle = '#5c597e'
    context.beginPath()
    context.moveTo(32, 425)
    context.bezierCurveTo(150, 360, 208, 425, 292, 400)
    context.bezierCurveTo(370, 365, 416, 404, 480, 390)
    context.lineTo(480, 464)
    context.lineTo(32, 464)
    context.closePath()
    context.fill()
  }

  context.fillStyle = '#38314b'
  context.font = '600 19px Arial, sans-serif'
  context.letterSpacing = '3px'
  context.fillText('A LITTLE SPACE FOR', 42, 516)
  context.fillStyle = '#272333'
  context.font = 'italic 48px Georgia, serif'
  context.letterSpacing = '0'
  context.fillText('our story', 40, 570)
  context.fillStyle = '#8b7c82'
  context.font = '14px Arial, sans-serif'
  context.letterSpacing = '2px'
  context.fillText('MADE OF LITTLE THINGS', 42, 610)

  const texture = new three.CanvasTexture(artwork)
  texture.colorSpace = three.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function roundedCardShape(three: typeof import('three'), width: number, height: number, radius: number) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const shape = new three.Shape()
  shape.moveTo(-halfWidth + radius, -halfHeight)
  shape.lineTo(halfWidth - radius, -halfHeight)
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius)
  shape.lineTo(halfWidth, halfHeight - radius)
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight)
  shape.lineTo(-halfWidth + radius, halfHeight)
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius)
  shape.lineTo(-halfWidth, -halfHeight + radius)
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight)
  return shape
}

function disposeScene(three: typeof import('three')) {
  if (!scene) return
  scene.traverse((object) => {
    if (!(object instanceof three.Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof three.Texture) value.dispose()
      }
      material.dispose()
    }
  })
}

async function initializeScene() {
  const host = sceneHost.value
  const targetCanvas = canvas.value
  if (!host || !targetCanvas || !window.WebGLRenderingContext) return

  const THREE = await import('three')
  if (sceneDisposed || !host.isConnected || !targetCanvas.isConnected) return

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: targetCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
  } catch (error) {
    console.warn('Visual 3D tidak tersedia; ilustrasi statis tetap digunakan.', error)
    return
  }

  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
  camera.position.set(0, 0, 8.5)

  scene.add(new THREE.HemisphereLight(0xfff5e9, 0x564578, 2.4))
  const keyLight = new THREE.DirectionalLight(0xffffff, 3)
  keyLight.position.set(-4, 5, 7)
  scene.add(keyLight)
  const pinkLight = new THREE.PointLight(0xff7968, 34, 12)
  pinkLight.position.set(3.2, -1.6, 3.5)
  scene.add(pinkLight)

  stage = new THREE.Group()
  scene.add(stage)

  const orbitGroup = new THREE.Group()
  orbitGroup.position.set(0.1, 0, -0.7)
  stage.add(orbitGroup)

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.45, 0.018, 8, 128),
    new THREE.MeshStandardMaterial({ color: '#ffe99a', roughness: 0.38, metalness: 0.2 }),
  )
  orbit.rotation.set(0.62, 0.2, -0.28)
  orbitGroup.add(orbit)

  const roseOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.68, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({ color: '#ffc6d5', transparent: true, opacity: 0.82 }),
  )
  roseOrbit.rotation.set(-0.68, 0.36, 0.42)
  roseOrbit.position.z = -0.18
  orbitGroup.add(roseOrbit)

  function createPhotoCard(
    source: string,
    position: readonly [number, number, number],
    scale: number,
    rotation: readonly [number, number, number],
  ) {
    const card = new THREE.Group()
    card.position.set(...position)
    card.scale.setScalar(scale)
    card.rotation.set(...rotation)
    stage?.add(card)

    const backing = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedCardShape(THREE, 2.5, 3.35, 0.15)),
      new THREE.MeshPhysicalMaterial({ color: '#fffaf3', roughness: 0.48, clearcoat: 0.55 }),
    )
    card.add(backing)

    const printTexture = createMemoryTexture(THREE)
    const printMaterial = new THREE.MeshBasicMaterial({ toneMapped: false })
    if (printTexture) printMaterial.map = printTexture
    const print = new THREE.Mesh(new THREE.PlaneGeometry(2.38, 3.2), printMaterial)
    print.position.z = 0.018
    card.add(print)

    const photo = new Image()
    const onPhotoLoad = () => {
      const photoTexture = createMemoryTexture(THREE, photo)
      if (!photoTexture) {
        console.warn('Foto hero tidak dapat diproses; artwork fallback tetap digunakan.')
        return
      }

      printMaterial.map?.dispose()
      printMaterial.map = photoTexture
      printMaterial.needsUpdate = true
      renderScene()
    }
    const onPhotoError = () => {
      console.warn('Foto hero tidak dapat dimuat; artwork fallback tetap digunakan.')
    }
    photo.addEventListener('load', onPhotoLoad)
    photo.addEventListener('error', onPhotoError)
    photo.src = source

    return {
      card,
      release: () => {
        photo.removeEventListener('load', onPhotoLoad)
        photo.removeEventListener('error', onPhotoError)
      },
    }
  }

  const secondPhotoCard = createPhotoCard(
    heroOne,
    [-1.42, -0.12, 0.08],
    0.64,
    [-0.04, 0.12, 0.18],
  )
  const primaryPhotoCard = createPhotoCard(
    heroTwo,
    [0.28, 0, 0.5],
    1,
    [-0.08, -0.14, -0.1],
  )

  const heart = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.22, 0.07, 72, 10, 2, 3),
    new THREE.MeshPhysicalMaterial({ color: '#ff7968', roughness: 0.28, metalness: 0.08, clearcoat: 1 }),
  )
  heart.position.set(2.12, 1.48, 0.65)
  heart.rotation.set(0.3, 0.5, 0.2)
  stage.add(heart)

  const sparkles = new THREE.Group()
  stage.add(sparkles)
  const sparkleMaterial = new THREE.MeshStandardMaterial({
    color: '#fff2b8',
    emissive: '#ffcf79',
    emissiveIntensity: 0.35,
    roughness: 0.4,
  })
  const sparklePositions: readonly (readonly [number, number, number])[] = [
    [-1.8, 1.7, 0.8],
    [1.95, 0.6, -0.2],
    [-1.9, -1.5, 0.3],
    [1.6, -1.8, 0.2],
  ]
  for (const [x, y, z] of sparklePositions) {
    const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), sparkleMaterial)
    sparkle.position.set(x, y, z)
    sparkles.add(sparkle)
  }

  function resizeScene() {
    if (!host) return
    const bounds = host.getBoundingClientRect()
    if (!camera || bounds.width <= 0 || bounds.height <= 0) return
    camera.aspect = bounds.width / bounds.height
    camera.updateProjectionMatrix()
    renderer?.setSize(bounds.width, bounds.height, false)
    renderScene()
  }

  resizeObserver = new ResizeObserver(resizeScene)
  resizeObserver.observe(host)
  resizeScene()

  motionMedia = gsap.matchMedia()
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    ambientMotion = gsap.timeline({ paused: true, repeat: -1, yoyo: true })
      .to(primaryPhotoCard.card.rotation, { y: 0.12, x: -0.02, duration: 3.8, ease: 'sine.inOut' })
      .to(primaryPhotoCard.card.position, { y: 0.12, duration: 3.8, ease: 'sine.inOut' }, 0)
      .to(secondPhotoCard.card.rotation, { y: 0.2, x: -0.08, duration: 3.8, ease: 'sine.inOut' }, 0)
      .to(secondPhotoCard.card.position, { y: 0.08, duration: 3.8, ease: 'sine.inOut' }, 0)
      .to(heart.rotation, { z: 0.8, x: 0.5, duration: 3.8, ease: 'sine.inOut' }, 0)
      .to(orbitGroup.rotation, { z: 0.38, duration: 7.6, ease: 'sine.inOut' }, 0)
      .to(roseOrbit.rotation, { y: 0.52, duration: 7.6, ease: 'sine.inOut' }, 0)
    return () => {
      ambientMotion?.kill()
      ambientMotion = undefined
    }
  })

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduceMotion.addEventListener('change', updateRendering)
  const onVisibilityChange = () => updateRendering()
  document.addEventListener('visibilitychange', onVisibilityChange)

  intersectionObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return
    sceneVisible = entry.isIntersecting
    updateRendering()
  }, { threshold: 0.05 })
  intersectionObserver.observe(host)

  let rotateXTo: ((value: number) => void) | undefined
  let rotateYTo: ((value: number) => void) | undefined
  if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    rotateXTo = gsap.quickTo(stage.rotation, 'x', { duration: 0.65, ease: 'power3.out' })
    rotateYTo = gsap.quickTo(stage.rotation, 'y', { duration: 0.65, ease: 'power3.out' })
  }
  const onPointerMove = (event: PointerEvent) => {
    if (!rotateXTo || !rotateYTo) return
    const bounds = host.getBoundingClientRect()
    rotateXTo(((event.clientY - bounds.top) / bounds.height - 0.5) * -0.12)
    rotateYTo(((event.clientX - bounds.left) / bounds.width - 0.5) * 0.16)
  }
  const onPointerLeave = () => {
    rotateXTo?.(0)
    rotateYTo?.(0)
  }
  host.addEventListener('pointermove', onPointerMove, { passive: true })
  host.addEventListener('pointerleave', onPointerLeave)
  emit('ready')

  cleanupScene = () => {
    secondPhotoCard.release()
    primaryPhotoCard.release()
    host.removeEventListener('pointermove', onPointerMove)
    host.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    reduceMotion.removeEventListener('change', updateRendering)
    intersectionObserver?.disconnect()
    resizeObserver?.disconnect()
    motionMedia?.revert()
    renderer?.setAnimationLoop(null)
    disposeScene(THREE)
    renderer?.dispose()
    renderer?.forceContextLoss()
    renderer = undefined
    scene = undefined
    camera = undefined
    stage = undefined
  }
}

onMounted(() => {
  sceneDisposed = false
  const loadScene = () => {
    idleCallbackId = undefined
    fallbackTimer = undefined
    void initializeScene().catch((error: unknown) => {
      if (!sceneDisposed) {
        console.error('Visual 3D gagal dimuat; ilustrasi statis tetap ditampilkan.', error)
      }
    })
  }

  if (typeof window.requestIdleCallback === 'function') {
    idleCallbackId = window.requestIdleCallback(loadScene, { timeout: 1200 })
  } else {
    fallbackTimer = window.setTimeout(loadScene, 300)
  }
})

onBeforeUnmount(() => {
  sceneDisposed = true
  if (idleCallbackId !== undefined) window.cancelIdleCallback(idleCallbackId)
  if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
  cleanupScene?.()
})
</script>

<style scoped>
.home-hero-scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-hero-scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
