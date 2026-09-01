type SelectOption = { id: string; name: string; color: string }

export type NotionPropertyValue =
  | { type: 'select'; select: SelectOption | null }
  | { type: 'multi_select'; multi_select: SelectOption[] }
  | { type: 'status'; status: SelectOption | null }
  | { type: 'relation'; relation: { id: string }[] }
  | {
      type: 'people'
      people: { id: string; name: string | null; avatar_url: string | null }[]
    }
  | { type: 'date'; date: { start: string; end: string | null } | null }
  | {
      type: 'formula'
      formula:
        | { type: 'string'; string: string | null }
        | { type: 'number'; number: number | null }
        | { type: 'date'; date: { start: string } | null }
        | { type: 'boolean'; boolean: boolean | null }
    }
  | { type: 'url'; url: string | null }
  | { type: 'checkbox'; checkbox: boolean }
  | { type: 'number'; number: number | null }
  | { type: 'rich_text'; rich_text: { plain_text: string }[] }
  | { type: 'title'; title: { plain_text: string }[] }
