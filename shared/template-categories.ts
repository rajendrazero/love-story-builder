export const templateCategories = [
  { id: 'couple', label: 'Pasangan' },
  { id: 'greeting', label: 'Kartu ucapan' },
  { id: 'invitation', label: 'Undangan' },
] as const

export type TemplateCategoryId = typeof templateCategories[number]['id']

const legacyCategoryIds: Record<string, TemplateCategoryId> = {
  'kartu-ucapan': 'greeting',
  pasangan: 'couple',
  undangan: 'invitation',
}

export function resolveTemplateCategory(value: unknown): TemplateCategoryId | '' {
  if (typeof value !== 'string') return ''
  return templateCategories.find(category => category.id === value)?.id
    ?? legacyCategoryIds[value]
    ?? ''
}

export function categoryLabel(category: TemplateCategoryId | ''): string {
  return templateCategories.find(item => item.id === category)?.label ?? ''
}
