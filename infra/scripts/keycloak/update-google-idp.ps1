# ============================================================
# EduAI - Update Google IdP in Keycloak with new credentials
# ============================================================
# Run: .\update-google-idp.ps1
# Required: Keycloak running at http://localhost:8080
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

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EduAI - Mise a jour Google IdP Keycloak"  -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Get admin token ────────────────────────────────────────────────────────────
Write-Host "`nObtention du token admin..." -ForegroundColor Gray
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

# ── Step 1: Create a custom first broker login flow that skips profile review ──
Write-Host "`n[1/4] Creation d'un flux 'first broker login' sans interruption..." -ForegroundColor Yellow

$flowAlias = "first broker login no review"

# Check if the flow already exists
$existingFlows = Invoke-RestMethod -Method Get `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows" `
    -Headers $HEADERS

$flowExists = $existingFlows | Where-Object { $_.alias -eq $flowAlias }

if (-not $flowExists) {
    # Copy the default first broker login flow
    $copyBody = @{ newName = $flowAlias } | ConvertTo-Json
    try {
        Invoke-RestMethod -Method Post `
            -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/first broker login/copy" `
            -Headers $HEADERS -Body $copyBody | Out-Null
        Write-Host "  Flux copie depuis 'first broker login'." -ForegroundColor Green
    } catch {
        Write-Host "  WARN: Erreur copie flux: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Flux existe deja, on continue." -ForegroundColor Green
}

# Get all executions of the new flow and disable "Review Profile"
$executions = Invoke-RestMethod -Method Get `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/$([uri]::EscapeDataString($flowAlias))/executions" `
    -Headers $HEADERS

foreach ($exec in $executions) {
    if ($exec.displayName -like "*Review Profile*" -or $exec.providerId -like "*idp-review-profile*") {
        Write-Host "  Desactivation de 'Review Profile' (id: $($exec.id))..." -ForegroundColor Gray
        $execUpdate = @{
            id            = $exec.id
            requirement   = "DISABLED"
            displayName   = $exec.displayName
            configurable  = $exec.configurable
            providerId    = $exec.providerId
            level         = $exec.level
            index         = $exec.index
        } | ConvertTo-Json
        try {
            Invoke-RestMethod -Method Put `
                -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/$([uri]::EscapeDataString($flowAlias))/executions" `
                -Headers $HEADERS -Body $execUpdate | Out-Null
            Write-Host "  OK - 'Review Profile' desactive." -ForegroundColor Green
        } catch {
            Write-Host "  WARN: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# ── Step 2: Delete existing Google IdP ────────────────────────────────────────
Write-Host "`n[2/4] Suppression de l'ancien Google IdP..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Method Delete `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/google" `
        -Headers $HEADERS -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Ancien Google IdP supprime." -ForegroundColor Green
} catch {
    Write-Host "  (Aucun IdP Google existant a supprimer)" -ForegroundColor Gray
}

# ── Step 3: Create Google IdP with new credentials + custom flow ───────────────
Write-Host "`n[3/4] Creation du Google IdP avec les nouveaux credentials..." -ForegroundColor Yellow

$googleIDP = @{
    alias                    = "google"
    displayName              = "Google"
    providerId               = "google"
    enabled                  = $true
    trustEmail               = $true
    storeToken               = $false
    addReadTokenRoleOnCreate = $false
    firstBrokerLoginFlowAlias = $flowAlias
    config = @{
        clientId     = $GOOGLE_CLIENT_ID
        clientSecret = $GOOGLE_CLIENT_SECRET
        defaultScope = "openid email profile"
        hostedDomain = ""
        userIp       = "false"
        offlineAccess = "false"
        syncMode     = "INHERIT"
        guiOrder     = "1"
    }
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Method Post `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances" `
        -Headers $HEADERS -Body $googleIDP | Out-Null
    Write-Host "  Google IdP cree avec succes!" -ForegroundColor Green
} catch {
    Write-Host "ERREUR Google IdP: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ── Step 4: Add email mapper for Google ───────────────────────────────────────
Write-Host "`n[4/4] Ajout du mapper email pour Google..." -ForegroundColor Yellow

$emailMapper = @{
    name            = "email"
    identityProviderMapper = "oidc-user-attribute-idp-mapper"
    identityProviderAlias  = "google"
    config = @{
        syncMode          = "INHERIT"
        "user.attribute"  = "email"
        "claim"           = "email"
        "are.claim.values.regex" = "false"
    }
} | ConvertTo-Json -Depth 4

try {
    Invoke-RestMethod -Method Post `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/identity-provider/instances/google/mappers" `
        -Headers $HEADERS -Body $emailMapper | Out-Null
    Write-Host "  Mapper email ajoute." -ForegroundColor Green
} catch {
    Write-Host "  WARN: Mapper email peut exister deja: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration terminee avec succes!"       -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Client ID : $GOOGLE_CLIENT_ID" -ForegroundColor White
Write-Host "  Flux      : $flowAlias (sans 'Review Profile')" -ForegroundColor White
Write-Host "  trustEmail: true" -ForegroundColor White
Write-Host ""
Write-Host "URI de redirection a confirmer dans Google Console:" -ForegroundColor Yellow
Write-Host "  $KEYCLOAK_URL/realms/$REALM/broker/google/endpoint" -ForegroundColor White
Write-Host ""
Write-Host "Testez maintenant sur: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
