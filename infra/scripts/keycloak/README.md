# Scripts Keycloak — EduAI

## Utilisation
```powershell
# Depuis la racine du projet
powershell -ExecutionPolicy Bypass -File "infra/scripts/keycloak/<nom-du-script>.ps1"
```

## Scripts disponibles

| Script | Description |
|---|---|
| `initial-setup.ps1` | Setup complet initial de Keycloak (realm + client) |
| `setup.ps1` | Setup Keycloak alternatif |
| `configure-realm.ps1` | Configure le realm (sessions, password policy, mappers) |
| `setup-social-login.ps1` | Configure Google + GitHub IdP (interactif) |
| `update-google-idp.ps1` | Met à jour le Google IdP avec les bons credentials |
| `fix-google-relogin.ps1` | Corrige le re-login Google (syncMode=IMPORT) |
| `fix-client.ps1` | Corrige les redirects du client Keycloak |
| `fix-redirect.ps1` | Corrige les URIs de redirection post-logout |
| `set-theme.ps1` | Applique le thème personnalisé EduAI |
| `add-silent-sso.ps1` | Ajoute le fichier silent-check-sso.html |
| `delete-user.ps1` | Supprime un utilisateur du realm |
| `verify-google-idp.ps1` | Vérifie l'état du Google IdP |

## Prérequis
- Keycloak en cours d'exécution sur `http://localhost:8080`
- Credentials admin : `admin / admin`
