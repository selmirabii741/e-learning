$KC_URL = "http://localhost:8080"
$REALM = "elearning"

# 1. Get admin token
$tokenResp = Invoke-RestMethod -Method Post `
  -Uri "$KC_URL/realms/master/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "client_id=admin-cli&username=admin&password=admin&grant_type=password"
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "1. Got admin token" -ForegroundColor Green

# 2. Get client UUID
$clients = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/clients?clientId=elearning-frontend" -Headers $h
$uuid = $clients[0].id
Write-Host "2. Client UUID: $uuid" -ForegroundColor Cyan

# 3. Get current client
$client = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/clients/$uuid" -Headers $h
Write-Host "3. Current redirectUris: $($client.redirectUris -join ', ')" -ForegroundColor Yellow

# 4. Update redirect URIs to include all patterns the frontend uses
$client.redirectUris = @(
  "http://localhost:3000/*"
  "http://localhost:3000/auth/callback"
  "http://localhost:3000/silent-check-sso.html"
  "http://localhost:3000"
)
$client.webOrigins = @("http://localhost:3000", "+")

# Fix post.logout.redirect.uris
if ($client.attributes -is [PSCustomObject]) {
  $client.attributes | Add-Member -MemberType NoteProperty -Name "post.logout.redirect.uris" -Value "http://localhost:3000/*" -Force
} else {
  $client.attributes = @{ "post.logout.redirect.uris" = "http://localhost:3000/*" }
}

$json = $client | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Put -Uri "$KC_URL/admin/realms/$REALM/clients/$uuid" -Headers $h -Body $json | Out-Null
Write-Host "4. Client updated successfully!" -ForegroundColor Green

# 5. Verify
$updated = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/clients/$uuid" -Headers $h
Write-Host "5. New redirectUris: $($updated.redirectUris -join ', ')" -ForegroundColor Green
