$KEYCLOAK_URL = "http://localhost:8080"
$REALM        = "elearning"
$ADMIN_USER   = "admin"
$ADMIN_PASS   = "admin"

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
$HEADERS = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }

$CLIENT_ID = "1664f091-39a9-4868-ba13-b9712758c80f"
$CLIENT_URL = "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_ID"

$clientData = Invoke-RestMethod -Method Get -Uri $CLIENT_URL -Headers $HEADERS
$clientData.attributes | Add-Member -MemberType NoteProperty -Name "post.logout.redirect.uris" -Value "+" -Force
$clientData.attributes | Add-Member -MemberType NoteProperty -Name "default_redirect_uri" -Value "http://localhost:3000/dashboard" -Force

$jsonBody = $clientData | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Put -Uri $CLIENT_URL -Headers $HEADERS -Body $jsonBody
Write-Host "Client updated successfully!"
