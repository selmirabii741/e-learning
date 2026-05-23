$KC = "http://localhost:8080"
$REALM = "elearning"

$tokenBody = "client_id=admin-cli&username=admin&password=admin&grant_type=password"
$tokenResp = Invoke-RestMethod -Method Post `
  -Uri "$KC/realms/master/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $tokenBody
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Get client UUID
$clients = Invoke-RestMethod -Method Get -Uri "$KC/admin/realms/$REALM/clients?clientId=elearning-frontend" -Headers $h
$clientId = $clients[0].id
Write-Host "Client UUID: $clientId"

# Update with all needed redirect URIs
$updateJson = @{
  clientId = "elearning-frontend"
  publicClient = $true
  standardFlowEnabled = $true
  directAccessGrantsEnabled = $true
  redirectUris = @(
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:3000/*",
    "http://localhost:3000/login",
    "http://localhost:3000/register",
    "http://localhost:3000/dashboard",
    "http://localhost:3000/instructor",
    "http://localhost:3000/admin",
    "http://localhost:3000/silent-check-sso.html"
  )
  webOrigins = @("http://localhost:3000", "+")
  attributes = @{ "pkce.code.challenge.method" = "S256" }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Put -Uri "$KC/admin/realms/$REALM/clients/$clientId" -Headers $h -Body $updateJson | Out-Null
Write-Host "OK client redirect URIs updated"
