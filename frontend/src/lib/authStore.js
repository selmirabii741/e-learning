import { create } from 'zustand';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const USER_CACHE_KEY = 'eduai_user_cache';

const readCache = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY)); } catch { return null; }
};

const writeCache = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch { }
};

export const useAuthStore = create((set, get) => ({
  user: readCache(),   // ← instant: from cache, no wait
  token: null,
  isLoading: false,
  error: null,

  syncKeycloakUser: async (kc) => {
    if (!kc?.token) return;
    // If we already have a cached user, set token immediately and sync in background
    const cached = get().user;
    if (cached) set({ token: kc.token });

    set({ isLoading: !cached });
    try {
      const res = await fetch(`${API}/auth/keycloak-sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kc.token}` },
      });

      // Handle pending/rejected professors
      if (res.status === 403) {
        const data = await res.json();
        if (data.code === 'PROFESSOR_NOT_APPROVED') {
          const pendingUser = data.user || { status: data.status, role: 'instructor' };
          pendingUser.token = kc.token;
          writeCache(pendingUser);
          set({ user: pendingUser, token: kc.token, isLoading: false, error: null });
          return;
        }
      }

      if (!res.ok) throw new Error('sync failed');
      const { user } = await res.json();
      writeCache(user);
      set({ user, token: kc.token, isLoading: false, error: null });
    } catch (err) {
      console.error('KC sync error:', err);
      set({ isLoading: false });
    }
  },

  refreshToken: async () => {
    if (typeof window === 'undefined') return null;
    const { getKeycloak } = await import('./keycloak');
    const kc = getKeycloak();
    if (!kc) return null;
    try {
      await kc.updateToken(30);
      set({ token: kc.token });
      return kc.token;
    } catch {
      return null;
    }
  },

  logout: async () => {
    if (typeof window === 'undefined') return;
    const { getKeycloak } = await import('./keycloak');
    const kc = getKeycloak();
    const idToken = kc?.idToken;
    writeCache(null);
    sessionStorage.removeItem('kc_token_cache');
    set({ user: null, token: null });
    if (kc?.authenticated) {
      kc.logout({
        redirectUri: window.location.origin + '/',
        ...(idToken ? { id_token_hint: idToken } : {}),
      });
    } else {
      window.location.href = '/';
    }
  },

  updateUser: (fields) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...fields } : state.user;
      writeCache(updated);
      return { user: updated };
    });
  },
}));
