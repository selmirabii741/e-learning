$KC = "http://localhost:8080"
$REALM = "elearning"

$tokenBody = "client_id=admin-cli&username=admin&password=admin&grant_type=password"
$tokenResp = Invoke-RestMethod -Method Post `
  -Uri "$KC/realms/master/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $tokenBody
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

$clients = Invoke-RestMethod -Method Get -Uri "$KC/admin/realms/$REALM/clients?clientId=elearning-frontend" -Headers $h
$clientUUID = $clients[0].id

$clientUpdate = @{
  clientId = "elearning-frontend"
  name = "EduAI Frontend"
  publicClient = $true
  redirectUris = @(
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:3000/*",
    "http://localhost:3000/silent-check-sso.html"
  )
  webOrigins = @("http://localhost:3000", "+")
  attributes = @{
    "pkce.code.challenge.method" = "S256"
    "post.logout.redirect.uris" = "http://localhost:3000/login##"
  }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method Put -Uri "$KC/admin/realms/$REALM/clients/$clientUUID" -Headers $h -Body $clientUpdate | Out-Null
Write-Host "Redirect URIs updated with explicit silent-check-sso.html"
