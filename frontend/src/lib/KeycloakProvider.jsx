'use client';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { getKeycloak, resolveKcReady } from './keycloak';
import { useAuthStore } from './authStore';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function TokenSyncer({ children }) {
  const { syncKeycloakUser, user } = useAuthStore();
  const synced = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const kc = getKeycloak();
    if (!kc) return;

    const trySync = () => {
      if (kc.authenticated && kc.token && !synced.current) {
        synced.current = true;
        syncKeycloakUser(kc);
      }
    };

    trySync();
    const id = setInterval(trySync, 500);

    const timeout = setTimeout(() => clearInterval(id), 5000);
    return () => { clearInterval(id); clearTimeout(timeout); };
  }, [syncKeycloakUser]);

  // Redirect pending/rejected professors to the approval page
  useEffect(() => {
    if (user && user.role === 'instructor' && user.status && user.status !== 'approved') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/pending-approval') {
        router.replace('/pending-approval');
      }
    } else if (user && (user.role !== 'instructor' || user.status === 'approved')) {
      const currentPath = window.location.pathname;
      if (currentPath === '/pending-approval') {
        router.replace('/');
      }
    }
  }, [user, router]);

  return children;
}

export default function KeycloakProvider({ children }) {
  const kc = getKeycloak();
  const isServer = typeof window === 'undefined';
  const [kcFailed, setKcFailed] = useState(false);

  // Dummy client for SSR to prevent useKeycloak errors and hydration mismatches
  const dummyKc = {
    init: () => Promise.resolve(false),
    login: () => {},
    logout: () => {},
    register: () => {},
    accountManagement: () => {},
    createLoginUrl: () => '',
    createLogoutUrl: () => '',
    createRegisterUrl: () => '',
    createAccountUrl: () => '',
    isTokenExpired: () => false,
    updateToken: () => Promise.resolve(false),
    clearToken: () => {},
    hasRealmRole: () => false,
    hasResourceRole: () => false,
    loadUserInfo: () => Promise.resolve({}),
    loadUserProfile: () => Promise.resolve({}),
    authenticated: false,
  };

  const authClient = isServer ? dummyKc : kc;

  // If Keycloak init failed, render children without KC wrapper
  // This allows the app to work even when Keycloak/Docker is not running
  if (!authClient || kcFailed) {
    return children;
  }

  return (
    <ReactKeycloakProvider
      authClient={authClient}
      initOptions={{
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: typeof window !== 'undefined' ? window.location.origin + '/silent-check-sso.html' : '',
        checkLoginIframe: false,
        pkceMethod: 'S256',
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
      }}
      onEvent={(eventType) => {
        // Resolve KC ready promise on any init outcome
        if (['onReady', 'onAuthSuccess', 'onAuthError', 'onInitError'].includes(eventType)) {
          resolveKcReady();
        }

        // If Keycloak initialization failed (server not running), mark as failed
        // so the app can still render and work without Keycloak
        if (eventType === 'onInitError') {
          console.warn('[KeycloakProvider] Keycloak initialization failed — running without SSO');
          setKcFailed(true);
        }

        if (eventType === 'onAuthSuccess') {
          const kc = getKeycloak();
          if (kc?.authenticated && kc.token) {
            // Cache token in sessionStorage (cleared on tab close = safe)
            sessionStorage.setItem('kc_token_cache', kc.token);
            useAuthStore.setState({ token: kc.token });
            useAuthStore.getState().syncKeycloakUser(kc);
          }
        }

        if (eventType === 'onAuthLogout' || eventType === 'onTokenExpired') {
          sessionStorage.removeItem('kc_token_cache');
          useAuthStore.setState({ token: null });
        }
      }}
      onTokens={(tokens) => {

        if (tokens.token) {
          const store = useAuthStore.getState();
          if (store.user) {
            useAuthStore.setState({ token: tokens.token });
          }
        }
      }}
    >
      <TokenSyncer>{children}</TokenSyncer>
    </ReactKeycloakProvider>
  );
}
