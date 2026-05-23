$KC_URL = "http://localhost:8080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM = "elearning"

# 1. Get Token
$tokenBody = "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASS&grant_type=password"
try {
  $tokenResp = Invoke-RestMethod -Method Post -Uri "$KC_URL/realms/master/protocol/openid-connect/token" -ContentType "application/x-www-form-urlencoded" -Body $tokenBody
  $token = $tokenResp.access_token
  $h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
} catch {
  Write-Host "Wait for Keycloak to boot up fully..."
  exit 1
}

# 2. Update Realm Theme
Write-Host "Updating Realm theme..."
$realmData = @{ loginTheme = "eduai" } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "$KC_URL/admin/realms/$REALM" -Headers $h -Body $realmData
Write-Host "Theme updated to 'eduai'."
