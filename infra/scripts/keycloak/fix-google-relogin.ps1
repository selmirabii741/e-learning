# ============================================================
# EduAI - Fix Google IdP syncMode (INHERIT -> IMPORT)
# ============================================================
# Root cause: "No enum constant ProviderSyncMode.INHERIT"
# Fix: syncMode must be "IMPORT" or "FORCE", not "INHERIT"
# ============================================================

$KEYCLOAK_URL = "http://localhost:8080"
$REALM        = "elearning"
$ADMIN_USER   = "admin"
$ADMIN_PASS   = "admin"

# ===>>> Entrez vos credentials Google OAuth ici (ne pas committer) <<<===
$GOOGLE_CLIENT_ID     = Read-Host "Google Client ID"
$GOOGLE_CLIENT_SECRET = Read-Host "Google Client Secret" -AsSecureString
$GOOGLE_CLIENT_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GOOGLE_CLIENT_SECRET))
$FLOW_ALIAS           = "first broker login no review"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Fix: Google IdP syncMode INHERIT->IMPORT"
Write-Host "==========================================" -ForegroundColor Cyan

# ── Get admin token ────────────────────────────────────────
try {
    $tokenResponse = Invoke-RestMethod -Method Post `
        -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            grant_type = "password"
            client_id  = "admin-cli"
            username   = $ADMIN_USER
            password   = $ADMIN_PASS
        }
    $TOKEN   = $tokenResponse.access_token
    $HEADERS = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
    Write-Host "Token admin obtenu." -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Keycloak inaccessible sur $KEYCLOAK_URL" -ForegroundColor Red
    exit 1
}

# ── Delete old Google IdP ───────────────────────────────────
Write-Host "`n[1/2] Suppression de l'ancien Google IdP..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Method Delete `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/google" `
        -Headers $HEADERS -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Supprime." -ForegroundColor Green
} catch {
    Write-Host "  (Aucun IdP existant)" -ForegroundColor Gray
}

# ── Recreate Google IdP with syncMode=IMPORT ───────────────
Write-Host "`n[2/2] Creation Google IdP avec syncMode=IMPORT..." -ForegroundColor Yellow

$googleIDP = @{
    alias                     = "google"
    displayName               = "Google"
    providerId                = "google"
    enabled                   = $true
    trustEmail                = $true
    storeToken                = $false
    addReadTokenRoleOnCreate  = $false
    firstBrokerLoginFlowAlias = $FLOW_ALIAS
    config = @{
        clientId      = $GOOGLE_CLIENT_ID
        clientSecret  = $GOOGLE_CLIENT_SECRET
        defaultScope  = "openid email profile"
        hostedDomain  = ""
        userIp        = "false"
        offlineAccess = "false"
        syncMode      = "IMPORT"
        guiOrder      = "1"
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Method Post `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances" `
        -Headers $HEADERS -Body $googleIDP | Out-Null
    Write-Host "  Google IdP cree avec syncMode=IMPORT!" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ── Summary ────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Correction appliquee!"                   -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  syncMode=IMPORT : les attributs Google ne sont importes"
Write-Host "  qu'a la premiere connexion => pas d'erreur au re-login."
Write-Host ""
Write-Host "Testez:"
Write-Host "  1. Login avec Google => /dashboard"
Write-Host "  2. Deconnexion"
Write-Host "  3. Re-login Google => doit fonctionner!"
Write-Host ""
