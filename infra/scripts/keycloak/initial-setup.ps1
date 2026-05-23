# ==========================================
# KEYCLOAK FULL SETUP SCRIPT FOR EDUAI
# ==========================================

$KC_URL = "http://localhost:8080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM = "elearning"
$CLIENT_ID = "elearning-frontend"

Write-Host "1. Getting Master Admin Token..." -ForegroundColor Cyan
$tokenBody = "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASS&grant_type=password"
try {
  $tokenResp = Invoke-RestMethod -Method Post `
    -Uri "$KC_URL/realms/master/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $tokenBody
  $token = $tokenResp.access_token
  $h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
  Write-Host "   OK" -ForegroundColor Green
} catch {
  Write-Host "   ERROR: Keycloak not running or bad admin credentials" -ForegroundColor Red
  exit
}

# ------------------------------------------
# 2. CREATE REALM
# ------------------------------------------
Write-Host "2. Creating Realm '$REALM'..." -ForegroundColor Cyan
$realmJson = @{
  id = $REALM
  realm = $REALM
  displayName = "EduAI E-Learning"
  displayNameHtml = "<strong style='color:#818cf8;font-family:Inter,sans-serif'>EduAI</strong>"
  enabled = $true
  registrationAllowed = $true
  resetPasswordAllowed = $true
  loginWithEmailAllowed = $true
  duplicateEmailsAllowed = $false
  verifyEmail = $false
  # Session settings
  ssoSessionIdleTimeout = 3600
  ssoSessionMaxLifespan = 86400
  accessTokenLifespan = 900
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

try {
  Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms" -Headers $h -Body $realmJson | Out-Null
  Write-Host "   OK - Realm created" -ForegroundColor Green
} catch {
  Write-Host "   WARN: Realm may already exist, updating settings..." -ForegroundColor Yellow
  Invoke-RestMethod -Method Put -Uri "$KC_URL/admin/realms/$REALM" -Headers $h -Body $realmJson | Out-Null
}

# ------------------------------------------
# 3. CREATE CLIENT
# ------------------------------------------
Write-Host "3. Creating Client '$CLIENT_ID'..." -ForegroundColor Cyan
$clientJson = @{
  clientId = $CLIENT_ID
  name = "EduAI Frontend"
  description = "Frontend application for EduAI platform"
  enabled = $true
  publicClient = $true
  standardFlowEnabled = $true
  directAccessGrantsEnabled = $false
  implicitFlowEnabled = $false
  redirectUris = @(
    "http://localhost:3000/*",
    "http://localhost:3000/silent-check-sso.html"
  )
  webOrigins = @("http://localhost:3000", "+")
  attributes = @{
    "pkce.code.challenge.method" = "S256"
    "post.logout.redirect.uris" = "http://localhost:3000/login##"
  }
} | ConvertTo-Json -Depth 4

try {
  Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms/$REALM/clients" -Headers $h -Body $clientJson | Out-Null
  Write-Host "   OK - Client created" -ForegroundColor Green
} catch {
  Write-Host "   WARN: Client already exists. Fetching UUID to update..." -ForegroundColor Yellow
}

$clients = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" -Headers $h
$clientUUID = $clients[0].id

# Update client just in case
Invoke-RestMethod -Method Put -Uri "$KC_URL/admin/realms/$REALM/clients/$clientUUID" -Headers $h -Body $clientJson | Out-Null

# ------------------------------------------
# 4. CREATE ROLES
# ------------------------------------------
Write-Host "4. Creating Realm Roles..." -ForegroundColor Cyan
$roles = @("student", "instructor", "admin")
foreach ($r in $roles) {
  $roleJson = @{ name = $r } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms/$REALM/roles" -Headers $h -Body $roleJson | Out-Null
    Write-Host "   OK - Role '$r'" -ForegroundColor Green
  } catch {
    Write-Host "   WARN - Role '$r' exists" -ForegroundColor DarkGray
  }
}

# ------------------------------------------
# 5. MAPPERS (Add roles to JWT token)
# ------------------------------------------
Write-Host "5. Configuring Protocol Mappers..." -ForegroundColor Cyan

# Realm roles mapper
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
  }
} | ConvertTo-Json -Depth 4

try {
  Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms/$REALM/clients/$clientUUID/protocol-mappers/models" -Headers $h -Body $rolesMapper | Out-Null
} catch {}

Write-Host "   OK - Mappers configured" -ForegroundColor Green

# ------------------------------------------
# 6. TEST USERS
# ------------------------------------------
Write-Host "6. Creating Test Users..." -ForegroundColor Cyan

function CreateTestUser($uname, $pwd, $email, $fname, $lname, $roleName) {
  $userJson = @{
    username = $uname
    email = $email
    firstName = $fname
    lastName = $lname
    enabled = $true
    emailVerified = $true
    attributes = @{ role = @($roleName) }
    credentials = @( @{ type = "password"; value = $pwd; temporary = $false } )
  } | ConvertTo-Json -Depth 4

  try {
    Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms/$REALM/users" -Headers $h -Body $userJson | Out-Null
    Write-Host "   OK - User '$uname'" -ForegroundColor Green
    
    # Get user ID
    $users = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/users?username=$uname" -Headers $h
    $userId = $users[0].id
    
    # Assign role
    $roleDef = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/roles/$roleName" -Headers $h
    $rolesToAssign = @( @{ id = $roleDef.id; name = $roleDef.name } ) | ConvertTo-Json -Depth 3
    
    Invoke-RestMethod -Method Post -Uri "$KC_URL/admin/realms/$REALM/users/$userId/role-mappings/realm" -Headers $h -Body $rolesToAssign | Out-Null
    
  } catch {
    Write-Host "   WARN - User '$uname' probably already exists" -ForegroundColor DarkGray
  }
}

CreateTestUser "student1" "Student123!" "student1@eduai.com" "Alice" "Martin" "student"
CreateTestUser "instructor1" "Instructor123!" "instructor1@eduai.com" "Prof" "Durand" "instructor"
CreateTestUser "admin1" "Admin123!" "admin1@eduai.com" "Super" "Admin" "admin"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ EduAI Keycloak setup is complete!" -ForegroundColor Green
Write-Host "You can safely run this script anytime to reset/ensure config."
Write-Host "Users: student1, instructor1, admin1"
Write-Host "Passwords: [Role]123!"
Write-Host "==========================================" -ForegroundColor Cyan
