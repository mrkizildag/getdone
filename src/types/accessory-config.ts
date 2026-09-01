export type SupportedPropertyType =
  | 'select'
  | 'multi_select'
  | 'status'
  | 'relation'
  | 'people'
  | 'date'
  | 'formula'
  | 'url'
  | 'checkbox'
  | 'number'
  | 'rich_text'
  | 'title'

export interface AccessorySlot {
  propertyName: string
  propertyType: SupportedPropertyType
  label?: string
  visible: boolean
}

export interface AccessoryConfig {
  databaseId: string
  slots: AccessorySlot[]
}
