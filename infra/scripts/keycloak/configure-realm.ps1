$KC = "http://localhost:8080"
$REALM = "elearning"

$tokenBody = "client_id=admin-cli&username=admin&password=admin&grant_type=password"
$tokenResp = Invoke-RestMethod -Method Post `
  -Uri "$KC/realms/master/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $tokenBody
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Configuring realm settings..." -ForegroundColor Cyan

$realmSettings = @{
  realm = $REALM
  displayName = "EduAI E-Learning"
  displayNameHtml = "<strong style='color:#818cf8;font-family:Inter,sans-serif'>EduAI</strong>"
  enabled = $true
  registrationAllowed = $true
  registrationEmailAsUsername = $false
  resetPasswordAllowed = $true
  loginWithEmailAllowed = $true
  duplicateEmailsAllowed = $false
  verifyEmail = $false
  loginTheme = "keycloak"
  accountTheme = "keycloak.v2"
  adminTheme = "keycloak.v2"
  emailTheme = "keycloak"
  # Session settings
  ssoSessionIdleTimeout = 3600        # 1 hour idle
  ssoSessionMaxLifespan = 86400       # 24 hours max
  accessTokenLifespan = 900           # 15 min access tokens
  # Brute force protection
  bruteForceProtected = $true
  permanentLockout = $false
  maxFailureWaitSeconds = 900
  minimumQuickLoginWaitSeconds = 60
  waitIncrementSeconds = 60
  quickLoginCheckMilliSeconds = 1000
  maxDeltaTimeSeconds = 43200
  failureFactor = 5
  # Password policy
  passwordPolicy = "length(8) and digits(1) and upperCase(1)"
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Method Put -Uri "$KC/admin/realms/$REALM" -Headers $h -Body $realmSettings | Out-Null
Write-Host "  OK realm settings updated" -ForegroundColor Green

# Configure client with login_hint support and back channel logout
$clients = Invoke-RestMethod -Method Get -Uri "$KC/admin/realms/$REALM/clients?clientId=elearning-frontend" -Headers $h
$clientUUID = $clients[0].id

$clientUpdate = @{
  clientId = "elearning-frontend"
  name = "EduAI Frontend"
  description = "EduAI e-learning platform frontend"
  enabled = $true
  publicClient = $true
  standardFlowEnabled = $true
  directAccessGrantsEnabled = $false
  implicitFlowEnabled = $false
  serviceAccountsEnabled = $false
  redirectUris = @(
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:3000/*"
  )
  webOrigins = @("http://localhost:3000", "+")
  attributes = @{
    "pkce.code.challenge.method" = "S256"
    "post.logout.redirect.uris" = "http://localhost:3000/login##"
    "login_theme" = ""
  }
  defaultClientScopes = @("web-origins", "acr", "roles", "profile", "email")
  optionalClientScopes = @("address", "phone", "offline_access", "microprofile-jwt")
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Put -Uri "$KC/admin/realms/$REALM/clients/$clientUUID" -Headers $h -Body $clientUpdate | Out-Null
Write-Host "  OK client configured" -ForegroundColor Green

# Add "role" to the token claims via a protocol mapper
Write-Host "Adding role attribute to JWT token..." -ForegroundColor Cyan

$mapper = @{
  name = "user-role-attribute"
  protocol = "openid-connect"
  protocolMapper = "oidc-usermodel-attribute-mapper"
  config = @{
    "user.attribute" = "role"
    "claim.name" = "role"
    "jsonType.label" = "String"
    "id.token.claim" = "true"
    "access.token.claim" = "true"
    "userinfo.token.claim" = "true"
    "multivalued" = "false"
    "aggregate.attrs" = "false"
  }
} | ConvertTo-Json -Depth 4

try {
  Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/clients/$clientUUID/protocol-mappers/models" -Headers $h -Body $mapper | Out-Null
  Write-Host "  OK role mapper added" -ForegroundColor Green
} catch {
  Write-Host "  WARN: mapper may exist" -ForegroundColor Yellow
}

# Add realm_access roles mapper (standard)
$rolesMapper = @{
  name = "realm-roles-mapper"
  protocol = "openid-connect"
  protocolMapper = "oidc-usermodel-realm-role-mapper"
  config = @{
    "claim.name" = "realm_access.roles"
    "jsonType.label" = "String"
    "id.token.claim" = "true"
    "access.token.claim" = "true"
    "userinfo.token.claim" = "true"
    "multivalued" = "true"
    "user.attribute" = "foo"
  }
} | ConvertTo-Json -Depth 4

try {
  Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/clients/$clientUUID/protocol-mappers/models" -Headers $h -Body $rolesMapper | Out-Null
  Write-Host "  OK realm roles mapper added to token" -ForegroundColor Green
} catch {
  Write-Host "  WARN: roles mapper may exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Keycloak realm fully configured!" -ForegroundColor Green
Write-Host "  - Password policy: min 8 chars, 1 digit, 1 uppercase" -ForegroundColor White
Write-Host "  - Sessions: 1h idle, 24h max, 15min access tokens" -ForegroundColor White
Write-Host "  - Brute-force protection: 5 attempts before lockout" -ForegroundColor White
Write-Host "  - Role attribute mapped into JWT claims" -ForegroundColor White
Write-Host "  - Post-logout redirect: http://localhost:3000/login" -ForegroundColor White
