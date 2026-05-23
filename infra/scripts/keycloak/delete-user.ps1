$KC_URL = "http://localhost:8080"
$ADMIN_USER = "admin"
$ADMIN_PASS = "admin"
$REALM = "elearning"
$EMAIL = "aymenbensalah2004@gmail.com"

# 1. Get Token
$tokenBody = "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASS&grant_type=password"
$tokenResp = Invoke-RestMethod -Method Post -Uri "$KC_URL/realms/master/protocol/openid-connect/token" -ContentType "application/x-www-form-urlencoded" -Body $tokenBody
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# 2. Find user by email
$users = Invoke-RestMethod -Method Get -Uri "$KC_URL/admin/realms/$REALM/users?email=$EMAIL" -Headers $h

if ($users.Length -eq 0) {
    Write-Host "User with email $EMAIL NOT FOUND in Keycloak."
    exit
}

$userId = $users[0].id
$username = $users[0].username
Write-Host "Found user in Keycloak: ID=$userId, Username=$username"

# 3. Delete user
Invoke-RestMethod -Method Delete -Uri "$KC_URL/admin/realms/$REALM/users/$userId" -Headers $h
Write-Host "✅ User '$EMAIL' successfully deleted from Keycloak."
