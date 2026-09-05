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

/** The Notion client builds an OAuth client at module scope on import. */
export const OAuth = {
  RedirectMethod: { Web: 'web', App: 'app', AppURI: 'appURI' },
  PKCEClient: class {
    async authorizationRequest() {
      return {}
    }
    async authorize() {
      return {}
    }
    async getTokens() {
      return undefined
    }
    async setTokens() {
      return undefined
    }
    async removeTokens() {
      return undefined
    }
  },
}

/** No preferences are set under test; callers fall back to their defaults. */
export const getPreferenceValues = () => ({})
