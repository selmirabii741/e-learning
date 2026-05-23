# ============================================================
# EduAI - FINAL correct flow fix for social login
#
# Correct logic:
#   Handle Existing Account  -> ALTERNATIVE
#     idp-auto-link          -> REQUIRED  (links existing Keycloak users by email)
#   Create User If Unique    -> REQUIRED  (creates new users when no existing account)
#
# Why this works:
#   - NEW user via Google: Handle Existing Account (ALTERNATIVE) tries idp-auto-link,
#     finds no Keycloak user -> sub-flow fails -> ALTERNATIVE so skip.
#     Create User If Unique (REQUIRED) creates the new Keycloak user. Done.
#
#   - EXISTING Keycloak user (no Google link): Handle Existing Account runs,
#     idp-auto-link finds user by email -> links Google -> Done.
#
#   - Already federated user: first broker login flow doesn't run at all. Done.
# ============================================================

$KEYCLOAK_URL = "http://localhost:8080"
$REALM        = "elearning"
$FLOW_ALIAS   = "first broker login no review"

$token = (Invoke-RestMethod -Method Post `
    -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{ grant_type="password"; client_id="admin-cli"; username="admin"; password="admin" }
).access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "Token obtenu." -ForegroundColor Green

$execs = Invoke-RestMethod -Method Get `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/$([uri]::EscapeDataString($FLOW_ALIAS))/executions" `
    -Headers $h

function Set-Req($exec, $req) {
    $body = @{
        id           = $exec.id
        requirement  = $req
        displayName  = $exec.displayName
        configurable = [bool]$exec.configurable
        providerId   = $exec.providerId
        level        = [int]$exec.level
        index        = [int]$exec.index
    } | ConvertTo-Json
    Invoke-RestMethod -Method Put `
        -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/$([uri]::EscapeDataString($FLOW_ALIAS))/executions" `
        -Headers $h -Body $body | Out-Null
}

Write-Host ""
Write-Host "Application de la configuration correcte..." -ForegroundColor Yellow

foreach ($exec in $execs) {
    switch ($exec.id) {
        # Handle Existing Account sub-flow => ALTERNATIVE (critical! not REQUIRED)
        "dd23174a-2ee2-406d-ae74-717b2b2809ef" {
            Write-Host "  Handle Existing Account      => ALTERNATIVE" -ForegroundColor Green
            Set-Req $exec "ALTERNATIVE"
        }
        # idp-auto-link => REQUIRED (links existing users silently)
        "ea52869f-87ff-4052-9f59-345719ced990" {
            Write-Host "  Automatically set existing user => REQUIRED" -ForegroundColor Green
            Set-Req $exec "REQUIRED"
        }
        # Create User If Unique => REQUIRED (creates new users, replaces ALTERNATIVE)
        "bde09240-70c4-49eb-9ab6-08df4f61e835" {
            Write-Host "  Create User If Unique        => REQUIRED" -ForegroundColor Green
            Set-Req $exec "REQUIRED"
        }
    }
}

Write-Host ""
Write-Host "Etat final:" -ForegroundColor Yellow
$execsFinal = Invoke-RestMethod -Method Get `
    -Uri "$KEYCLOAK_URL/admin/realms/$REALM/authentication/flows/$([uri]::EscapeDataString($FLOW_ALIAS))/executions" `
    -Headers $h

foreach ($e in $execsFinal) {
    $indent = "  " * $e.level
    $color  = if ($e.requirement -eq "DISABLED") { "Gray" } `
              elseif ($e.requirement -in @("REQUIRED","ALTERNATIVE")) { "Green" } `
              else { "White" }
    Write-Host ("$indent  [$($e.requirement.PadRight(12))] $($e.displayName)") -ForegroundColor $color
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DONE! Testez Google/GitHub sur http://localhost:3000/login" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
