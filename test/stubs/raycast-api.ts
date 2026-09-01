/** Minimal stand-in for the Raycast runtime module. See vitest.config.ts. */

const enumLike = (namespace: string) =>
  new Proxy(
    {},
    { get: (_target, key) => `${namespace}.${String(key)}` }
  ) as Record<string, string>

export const Icon = enumLike('Icon')
export const Color = enumLike('Color')

export const Image = {
  Mask: { Circle: 'circle', RoundedRectangle: 'rounded-rectangle' },
}

const store = new Map<string, string>()

export const LocalStorage = {
  getItem: async (key: string) => store.get(key),
  setItem: async (key: string, value: string) => {
    store.set(key, value)
  },
  removeItem: async (key: string) => {
    store.delete(key)
  },
  clear: async () => {
    store.clear()
  },
}
