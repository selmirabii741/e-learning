# ============================================================
# EduAI - Keycloak Social Login Setup (Google + GitHub)
# ============================================================
# Run: .\keycloak-social-login.ps1
# Required: Keycloak running at http://localhost:8080
# ============================================================

$KEYCLOAK_URL = "http://localhost:8080"
$REALM        = "elearning"
$ADMIN_USER   = "admin"
$ADMIN_PASS   = "admin"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EduAI - Social Login Setup (Google + GitHub)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Pre-filled values from your backend/.env ──────────────────────────────────
$GOOGLE_CLIENT_ID_DEFAULT = "1085481726635-dlvpde2q4ap21if36ojklsvjnqb7meed.apps.googleusercontent.com"

# ── Collect credentials ────────────────────────────────────────────────────────
Write-Host ">>> Configuration Google OAuth" -ForegroundColor Yellow
$GOOGLE_CLIENT_ID = Read-Host "Google Client ID [appuyer Entree pour utiliser la valeur du .env]"
if ([string]::IsNullOrWhiteSpace($GOOGLE_CLIENT_ID)) {
    $GOOGLE_CLIENT_ID = $GOOGLE_CLIENT_ID_DEFAULT
    Write-Host "  Utilisation de la valeur du .env : $GOOGLE_CLIENT_ID" -ForegroundColor Gray
}
$GOOGLE_SECRET = Read-Host "Google Client Secret (requis)"

Write-Host ""
Write-Host ">>> Configuration GitHub OAuth" -ForegroundColor Yellow
Write-Host "  Creer une app sur https://github.com/settings/developers" -ForegroundColor Gray
Write-Host "  URI de redirection a ajouter dans GitHub:" -ForegroundColor Gray
Write-Host "  $KEYCLOAK_URL/realms/$REALM/broker/github/endpoint" -ForegroundColor White
$GITHUB_CLIENT_ID = Read-Host "GitHub Client ID"
$GITHUB_SECRET    = Read-Host "GitHub Client Secret"

Write-Host ""
Write-Host "Obtention du token admin Keycloak..." -ForegroundColor Gray

# ── Get admin token ────────────────────────────────────────────────────────────
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
    $TOKEN = $tokenResponse.access_token
    Write-Host "  Token admin obtenu." -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Impossible de se connecter a Keycloak. Verifiez que Keycloak tourne sur $KEYCLOAK_URL" -ForegroundColor Red
    exit 1
}

$HEADERS = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE Identity Provider
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Configuration du provider Google..." -ForegroundColor Yellow

$googleIDP = @{
    alias              = "google"
    displayName        = "Google"
    providerId         = "google"
    enabled            = $true
    trustEmail         = $true
    storeToken         = $false
    addReadTokenRoleOnCreate = $false
    firstBrokerLoginFlowAlias = "first broker login no review"
    config = @{
        clientId           = $GOOGLE_CLIENT_ID
        clientSecret       = $GOOGLE_SECRET
        defaultScope       = "openid email profile"
        hostedDomain       = ""
        userIp             = "false"
        offlineAccess      = "false"
        syncMode           = "INHERIT"
        guiOrder           = "1"
    }
} | ConvertTo-Json -Depth 5

try {
    # Try to delete existing first (ignore error if not exists)
    Invoke-RestMethod -Method Delete `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/google" `
        -Headers $HEADERS -ErrorAction SilentlyContinue | Out-Null
} catch {}

try {
    Invoke-RestMethod -Method Post `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances" `
        -Headers $HEADERS -Body $googleIDP | Out-Null
    Write-Host "  Google IDP configure avec succes!" -ForegroundColor Green
} catch {
    Write-Host "ERREUR Google IDP: $($_.Exception.Message)" -ForegroundColor Red
}

# ─────────────────────────────────────────────────────────────────────────────
# GITHUB Identity Provider
# ─────────────────────────────────────────────────────────────────────────────
if (-not [string]::IsNullOrWhiteSpace($GITHUB_CLIENT_ID) -and -not [string]::IsNullOrWhiteSpace($GITHUB_SECRET)) {
    Write-Host ""
    Write-Host "Configuration du provider GitHub..." -ForegroundColor Yellow

    $githubIDP = @{
        alias              = "github"
        displayName        = "GitHub"
        providerId         = "github"
        enabled            = $true
        trustEmail         = $true
        storeToken         = $false
        addReadTokenRoleOnCreate = $false
        firstBrokerLoginFlowAlias = "first broker login no review"
        config = @{
            clientId           = $GITHUB_CLIENT_ID
            clientSecret       = $GITHUB_SECRET
            syncMode           = "INHERIT"
            guiOrder           = "2"
        }
    } | ConvertTo-Json -Depth 5

    try {
        Invoke-RestMethod -Method Delete `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/github" `
            -Headers $HEADERS -ErrorAction SilentlyContinue | Out-Null
    } catch {}

    try {
        Invoke-RestMethod -Method Post `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances" `
            -Headers $HEADERS -Body $githubIDP | Out-Null
        Write-Host "  GitHub IDP configure avec succes!" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR GitHub IDP: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  GitHub ignore (credentials vides)." -ForegroundColor Gray
}

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration terminee!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URI de redirection a configurer dans vos applications:" -ForegroundColor White
Write-Host "  Google  : $KEYCLOAK_URL/realms/$REALM/broker/google/endpoint" -ForegroundColor Yellow
Write-Host "  GitHub  : $KEYCLOAK_URL/realms/$REALM/broker/github/endpoint" -ForegroundColor Yellow
Write-Host ""
Write-Host "Les boutons sociaux sont maintenant visibles sur:" -ForegroundColor White
Write-Host "  - La page de login Keycloak (http://localhost:8080)" -ForegroundColor Gray
Write-Host "  - Les pages /login et /register de l'app React" -ForegroundColor Gray
Write-Host ""
