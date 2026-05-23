import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url:      process.env.NEXT_PUBLIC_KEYCLOAK_URL       || 'http://localhost:8180',
  realm:    process.env.NEXT_PUBLIC_KEYCLOAK_REALM     || 'elearning',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'elearning-frontend',
};

let _keycloak = null;

// Global promise — resolves once KC finishes initialising (success or fail)
let _kcReadyResolve;
export const kcReady = typeof window !== 'undefined'
  ? new Promise(r => { _kcReadyResolve = r; })
  : Promise.resolve();

export function resolveKcReady() {
  _kcReadyResolve?.();
}

export function getKeycloak() {
  if (typeof window === 'undefined') return null;
  if (!_keycloak) _keycloak = new Keycloak(keycloakConfig);
  return _keycloak;
}

export function resetKeycloak() {
  _keycloak = null;
}

export default keycloakConfig;
