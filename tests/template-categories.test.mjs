import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveTemplateCategory, templateCategories } from '../shared/template-categories.ts'
import { storyTemplates } from '../shared/story-templates.ts'

test('exposes all requested template categories and keeps current templates as couples', () => {
  assert.deepEqual(templateCategories.map(category => category.id), [
    'couple',
    'greeting',
    'invitation',
  ])
  assert.ok(storyTemplates.length > 0)
  assert.ok(storyTemplates.every(template => template.category === 'couple'))
  assert.ok(storyTemplates.every(template =>
    templateCategories.some(category => category.id === template.category),
  ))
})

test('keeps empty categories valid and resolves historical category query values', () => {
  const populatedCategories = new Set(storyTemplates.map(template => template.category))
  const emptyCategories = templateCategories.filter(category => !populatedCategories.has(category.id))

  assert.deepEqual(emptyCategories.map(category => category.id), ['greeting', 'invitation'])
  assert.equal(resolveTemplateCategory('pasangan'), 'couple')
  assert.equal(resolveTemplateCategory('kartu-ucapan'), 'greeting')
  assert.equal(resolveTemplateCategory('undangan'), 'invitation')
  assert.equal(resolveTemplateCategory('unknown'), '')
})
