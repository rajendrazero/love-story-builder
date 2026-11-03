import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const editor = readFileSync(new URL('../app/components/story-section-editor/StorySectionContentEditor.vue', import.meta.url), 'utf8')
const sectionEditor = readFileSync(new URL('../app/components/story-section-editor/StorySectionEditor.vue', import.meta.url), 'utf8')
const appIcon = readFileSync(new URL('../app/components/AppIcon.vue', import.meta.url), 'utf8')
const studio = readFileSync(new URL('../app/pages/studio.vue', import.meta.url), 'utf8')

test('repeatable section content has add and remove controls with schema-aligned limits', () => {
  for (const field of ['loveNotes', 'futureDreams']) {
    assert.match(editor, new RegExp(`v-for="\\([^"]+\\) in ${field}"`))
    assert.match(editor, new RegExp(`@click="addListItem\\('${field}'\\)"`))
    assert.match(editor, new RegExp(`@click="removeListItem\\('${field}', index\\)"`))
  }
  assert.match(editor, /items\.length >= 12/)
  assert.match(editor, /:disabled="loveNotes\.length >= 12"/)
  assert.match(editor, /:disabled="futureDreams\.length >= 12"/)
})

test('section ordering uses visible Lucide up and down arrow icons', () => {
  assert.match(sectionEditor, /AppIcon name="arrow-up"/)
  assert.match(sectionEditor, /AppIcon name="arrow-down"/)
  assert.match(sectionEditor, /\.section-order-actions button \{[\s\S]*?border-radius: 0\.85rem/)
  assert.match(appIcon, /'arrow-up': 'lucide:arrow-up'/)
  assert.match(appIcon, /'arrow-down': 'lucide:arrow-down'/)
})

test('studio exposes section-specific editors and preview for the active section', () => {
  for (const section of ['greeting', 'gallery', 'first-encounter', 'finale', 'moments-in-motion', 'music']) {
    assert.match(studio, new RegExp(`activeSectionType === '${section}'`))
  }
  assert.match(studio, /\['timeline', 'book', 'constellation'\]\.includes\(activeSectionType/)
  assert.match(studio, /contentEditorSectionTypes\.has\(activeSectionType\)/)
  assert.match(studio, /openActiveSectionPreview/)
  assert.match(studio, /<ImageField v-model="draft\.heroImage" label="Foto sampul"/)
})
