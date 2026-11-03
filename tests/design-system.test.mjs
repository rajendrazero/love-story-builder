import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const globalStyles = readFileSync(new URL('../app/assets/css/main.css', import.meta.url), 'utf8')
const tokenStyles = readFileSync(new URL('../app/assets/css/foundation/tokens.css', import.meta.url), 'utf8')
const accessibilityStyles = readFileSync(new URL('../app/assets/css/foundation/accessibility.css', import.meta.url), 'utf8')
const animationStyles = readFileSync(new URL('../app/assets/css/utilities/animations.css', import.meta.url), 'utf8')
const inputStyles = readFileSync(new URL('../app/assets/css/components/inputs.css', import.meta.url), 'utf8')
const appShellStyles = readFileSync(new URL('../app/assets/css/layouts/app-shell.css', import.meta.url), 'utf8')
const tailwindConfig = readFileSync(new URL('../tailwind.config.ts', import.meta.url), 'utf8')
const appButton = readFileSync(new URL('../app/components/AppButton.vue', import.meta.url), 'utf8')
const appConfirmDialog = readFileSync(new URL('../app/components/AppConfirmDialog.vue', import.meta.url), 'utf8')
const siteNavigation = readFileSync(new URL('../app/components/SiteNavigation.vue', import.meta.url), 'utf8')
const imageField = readFileSync(new URL('../app/components/ImageField.vue', import.meta.url), 'utf8')
const storyExperience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
const templateStyles = new Map([
  'editorial-rose',
  'midnight-cinema',
  'botanical-journal',
  'love-letter',
  'memory-atlas',
].map(id => [
  id,
  readFileSync(new URL(`../app/assets/css/templates/${id}.css`, import.meta.url), 'utf8'),
]))
const storySectionRenderer = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')
const appShell = readFileSync(new URL('../app/app.vue', import.meta.url), 'utf8')
const templatesCatalog = readFileSync(new URL('../app/pages/templates.vue', import.meta.url), 'utf8')
const mainLandmarkSources = [
  '../app/components/AccountAccess.vue',
  '../app/pages/account.vue',
  '../app/pages/index.vue',
  '../app/pages/privacy-policy.vue',
  '../app/pages/reset-password.vue',
  '../app/pages/studio.vue',
  '../app/pages/templates.vue',
  '../app/pages/terms.vue',
  '../app/pages/admin/index.vue',
  '../app/pages/w/[slug].vue',
].map(file => readFileSync(new URL(file, import.meta.url), 'utf8'))
const sharedButtonSurfaces = [
  '../app/components/SiteNavigation.vue',
  '../app/components/AccountAccess.vue',
  '../app/pages/account.vue',
  '../app/pages/studio.vue',
  '../app/pages/templates.vue',
].map(file => readFileSync(new URL(file, import.meta.url), 'utf8'))

function colorToken(name) {
  const match = tokenStyles.match(new RegExp(`${name}:\\s*(#[\\da-fA-F]{6})`))
  assert.ok(match, `${name} should be a six-digit hex color`)
  return match[1]
}

function contrastRatio(foreground, background) {
  function luminance(hex) {
    const channels = hex.slice(1).match(/.{2}/g).map(channel => Number.parseInt(channel, 16) / 255)
    const [red, green, blue] = channels.map(channel => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4)
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

test('design tokens cover semantic colors, typography, spacing, shape, elevation, and motion', () => {
  for (const token of [
    '--color-background',
    '--color-foreground',
    '--color-surface',
    '--color-muted-foreground',
    '--color-border',
    '--color-primary',
    '--color-secondary',
    '--color-accent',
    '--color-destructive',
    '--color-destructive-hover',
    '--color-destructive-foreground',
    '--color-success',
    '--color-warning',
    '--color-info',
    '--font-family-sans',
    '--font-size-display',
    '--font-size-h6',
    '--font-size-body-large',
    '--font-size-caption',
    '--space-1',
    '--space-24',
    '--radius-small',
    '--radius-extra-large',
    '--radius-full',
    '--shadow-small',
    '--shadow-default',
    '--shadow-overlay',
    '--motion-duration-fast',
    '--motion-ease-standard',
    '--breakpoint-xs',
    '--breakpoint-compact',
    '--breakpoint-3xl',
    '--z-dialog',
  ]) {
    assert.ok(tokenStyles.includes(`${token}:`), `${token} should be defined`)
  }
  for (const stylesheet of [
    './foundation/tokens.css',
    './foundation/accessibility.css',
    './utilities/animations.css',
    './components/inputs.css',
    './layouts/app-shell.css',
  ]) {
    assert.ok(globalStyles.includes(stylesheet), `${stylesheet} should be imported`)
  }
})

test('semantic text and action color pairs meet WCAG AA contrast', () => {
  const pairs = [
    ['--color-foreground', '--color-background'],
    ['--color-muted-foreground', '--color-surface'],
    ['--color-primary-foreground', '--color-primary'],
    ['--color-destructive-foreground', '--color-destructive'],
    ['--color-success', '--color-success-surface'],
    ['--color-warning', '--color-warning-surface'],
    ['--color-info', '--color-info-surface'],
    ['--color-destructive', '--color-destructive-surface'],
  ]

  for (const [foregroundName, backgroundName] of pairs) {
    const ratio = contrastRatio(colorToken(foregroundName), colorToken(backgroundName))
    assert.ok(ratio >= 4.5, `${foregroundName} on ${backgroundName} should meet 4.5:1 (got ${ratio.toFixed(2)}:1)`)
  }
})

test('Tailwind maps semantic and legacy utilities to CSS design tokens', () => {
  for (const token of [
    'background:',
    'foreground:',
    'primary:',
    'success:',
    'warning:',
    'info:',
    'fontSize:',
    'spacing:',
    'borderRadius:',
    'boxShadow:',
    'transitionDuration:',
    'transitionTimingFunction:',
  ]) {
    assert.ok(tailwindConfig.includes(token), `${token} should be mapped`)
  }
  assert.match(tailwindConfig, /ink: 'var\(--color-foreground\)'/)
  assert.match(tailwindConfig, /paper: 'var\(--color-background\)'/)
})

test('template variants use isolated namespaces and reach nested section content', () => {
  for (const [templateId, stylesheet] of templateStyles) {
    assert.ok(storyExperience.includes(`src="../assets/css/templates/${templateId}.css"`))
    assert.ok(
      storyExperience.includes(`<style src="../assets/css/templates/${templateId}.css"`),
      `${templateId} stylesheet should not be scoped to the layout component`,
    )
    assert.ok(stylesheet.includes(`.template-${templateId}`), `${templateId} styles should define their root namespace`)
    for (const otherId of templateStyles.keys()) {
      if (otherId === templateId) continue
      assert.doesNotMatch(
        stylesheet,
        new RegExp(`\\.template-${otherId}(?![\\w-])`),
        `${templateId} styles should not select ${otherId}`,
      )
    }
  }
  assert.doesNotMatch(storyExperience, /<style scoped/)
  assert.doesNotMatch(storyExperience, /:deep\(/)
  assert.doesNotMatch(templateStyles.get('memory-atlas'), /:deep\(/)
  assert.match(storyExperience, /@media \(max-width: 600px\)[\s\S]*\.story-detail[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(storyExperience, /min-height: 2\.75rem/)
  assert.match(storyExperience, /:class="\[`template-\$\{story\.templateId/)
})

test('AppButton exposes typed variants and native disabled/loading semantics', () => {
  assert.match(appButton, /type ButtonVariant = 'primary' \| 'secondary' \| 'ghost' \| 'danger'/)
  assert.match(appButton, /:disabled="disabled \|\| loading"/)
  assert.match(appButton, /:aria-busy="loading \? 'true' : undefined"/)
  assert.match(appButton, /<span v-if="loading" class="loading-spinner" aria-hidden="true" \/>/)
  assert.match(appButton, /type: 'button'/)
  assert.match(appButton, /:type="type"/)
  for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
    assert.ok(appButton.includes(`.app-button--${variant}`), `${variant} styling should exist`)
  }
  assert.match(appButton, /var\(--color-primary\)/)
  assert.match(appButton, /:focus-visible/)
})

test('shared form controls and reduced-motion behavior use the design tokens', () => {
  assert.match(inputStyles, /\.editor-input:focus-visible/)
  assert.doesNotMatch(inputStyles, /\.editor-input\s*\{[^}]*outline:\s*none/s)
  assert.match(accessibilityStyles, /select:focus-visible/)
  assert.match(animationStyles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(animationStyles, /--motion-duration-normal:\s*0ms/)
})

test('shared button variants are integrated into app navigation and account/editor/catalog actions', () => {
  for (const surface of sharedButtonSurfaces) {
    assert.match(surface, /<AppButton\b/, 'the surface should use the shared button component')
  }
})

test('confirmation dialog moves focus, isolates background content, and restores focus', () => {
  assert.match(appConfirmDialog, /role="dialog"/)
  assert.match(appConfirmDialog, /aria-modal="true"/)
  assert.match(appConfirmDialog, /child\.inert = true/)
  assert.match(appConfirmDialog, /element\.inert = wasInert/)
  assert.match(appConfirmDialog, /focusTarget\.focus\(\)/)
  assert.match(appConfirmDialog, /event\.key === 'Escape'/)
})

test('template preview dialog traps focus, isolates the catalog, and restores focus', () => {
  assert.match(templatesCatalog, /<Teleport to="body">/)
  assert.match(templatesCatalog, /role="dialog"\s+aria-modal="true"\s+aria-labelledby="template-preview-title"/)
  assert.match(templatesCatalog, /setPreviewBackgroundInert\(\)/)
  assert.match(templatesCatalog, /child\.inert = true/)
  assert.match(templatesCatalog, /element\.inert = wasInert/)
  assert.match(templatesCatalog, /event\.key === 'Escape'/)
  assert.match(templatesCatalog, /last\.focus\(\)/)
  assert.match(templatesCatalog, /first\.focus\(\)/)
  assert.match(templatesCatalog, /focusTarget\.focus\(\)/)
  assert.match(storyExperience, /:is="closable \? 'div' : 'main'"/)
})

test('mobile navigation is operable and restores focus when dismissed', () => {
  assert.match(siteNavigation, /aria-controls="site-navigation-links"/)
  assert.match(siteNavigation, /:aria-expanded="mobileMenuOpen"/)
  assert.match(siteNavigation, /@keydown\.esc\.prevent\.stop="closeMobileMenu\(true\)"/)
  assert.match(siteNavigation, /menuToggle\.value\?\.focus\(\)/)
  assert.match(siteNavigation, /@media \(max-width: 560px\)/)
  assert.match(siteNavigation, /min-height: 2\.75rem/)
})

test('image library controls meet touch target size and identify each photo', () => {
  assert.match(imageField, /class="inline-flex min-h-11 items-center text-xs font-semibold/)
  assert.match(imageField, /:aria-label="`Gunakan foto \$\{index \+ 1\} dari koleksi foto`"/)
  assert.match(appShellStyles, /@media \(pointer: coarse\)\s*\{\s*\.custom-scrollbar-track\s*\{\s*width: 1\.75rem;/)
  assert.match(appShellStyles, /\.custom-scrollbar-thumb\s*\{\s*width: 1\.5rem;/)
})

test('greeting video provides controls and pauses when reduced motion is enabled', () => {
  assert.match(storySectionRenderer, /:autoplay="videoAutoplay"/)
  assert.match(storySectionRenderer, /controls/)
  assert.match(storySectionRenderer, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)
  assert.match(storySectionRenderer, /greetingVideo\.value\?\.pause\(\)/)
  assert.match(storySectionRenderer, /removeEventListener\('change', updateMotionPreference\)/)
})

test('shared shell provides a visible-on-focus skip link to each route main landmark', () => {
  assert.match(appShell, /<a class="skip-link" :href="isPublicStoryRoute \? '#entrance-open' : '#main-content'">/)
  assert.match(appShellStyles, /\.skip-link:focus-visible/)
  assert.match(appShellStyles, /#main-content:focus-visible/)
  for (const source of mainLandmarkSources) {
    assert.match(source, /id="main-content"/)
    assert.match(source, /tabindex="-1"/)
  }
  assert.match(storyExperience, /:id="closable \? undefined : 'main-content'"/)
  assert.match(storyExperience, /:tabindex="closable \? undefined : -1"/)
})
