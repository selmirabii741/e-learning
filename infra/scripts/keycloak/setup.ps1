$KC = "http://localhost:8080"
$REALM = "elearning"

Write-Host "Getting admin token..." -ForegroundColor Cyan
$tokenBody = "client_id=admin-cli&username=admin&password=admin&grant_type=password"
$tokenResp = Invoke-RestMethod -Method Post `
  -Uri "$KC/realms/master/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $tokenBody
$token = $tokenResp.access_token
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "  OK token obtained" -ForegroundColor Green

Write-Host "Creating realm..." -ForegroundColor Cyan
$realmJson = '{"realm":"elearning","displayName":"EduAI E-Learning","enabled":true,"registrationAllowed":true,"resetPasswordAllowed":true,"loginWithEmailAllowed":true,"duplicateEmailsAllowed":false}'
try { Invoke-RestMethod -Method Post -Uri "$KC/admin/realms" -Headers $h -Body $realmJson | Out-Null; Write-Host "  OK realm created" -ForegroundColor Green }
catch { Write-Host "  WARN: $($_.ErrorDetails.Message)" -ForegroundColor Yellow }

Write-Host "Creating client..." -ForegroundColor Cyan
$clientJson = '{"clientId":"elearning-frontend","name":"EduAI Frontend","enabled":true,"publicClient":true,"standardFlowEnabled":true,"directAccessGrantsEnabled":true,"redirectUris":["http://localhost:3000/*"],"webOrigins":["http://localhost:3000"],"attributes":{"pkce.code.challenge.method":"S256"}}'
try { Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/clients" -Headers $h -Body $clientJson | Out-Null; Write-Host "  OK client created" -ForegroundColor Green }
catch { Write-Host "  WARN: $($_.ErrorDetails.Message)" -ForegroundColor Yellow }

Write-Host "Creating roles..." -ForegroundColor Cyan
foreach ($role in @("student","instructor","admin")) {
  $roleJson = "{`"name`":`"$role`",`"description`":`"Role $role`"}"
  try { Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/roles" -Headers $h -Body $roleJson | Out-Null; Write-Host "  OK role $role" -ForegroundColor Green }
  catch { Write-Host "  WARN role $role : $($_.ErrorDetails.Message)" -ForegroundColor Yellow }
}

function New-KcUser($uname, $email, $fname, $lname, $pwd, $role) {
  Write-Host "Creating user $uname ($role)..." -ForegroundColor Cyan
  $userJson = "{`"username`":`"$uname`",`"email`":`"$email`",`"firstName`":`"$fname`",`"lastName`":`"$lname`",`"enabled`":true,`"emailVerified`":true,`"credentials`":[{`"type`":`"password`",`"value`":`"$pwd`",`"temporary`":false}],`"attributes`":{`"role`":[`"$role`"]}}"
  try { Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/users" -Headers $h -Body $userJson | Out-Null; Write-Host "  OK user created" -ForegroundColor Green }
  catch { Write-Host "  WARN user: $($_.ErrorDetails.Message)" -ForegroundColor Yellow }
  
  $users = Invoke-RestMethod -Method Get -Uri "$KC/admin/realms/$REALM/users?username=$uname" -Headers $h
  if ($users.Count -eq 0) { Write-Host "  ERROR: user not found after creation" -ForegroundColor Red; return }
  $userId = $users[0].id
  $roleObj = Invoke-RestMethod -Method Get -Uri "$KC/admin/realms/$REALM/roles/$role" -Headers $h
  $roleArr = ConvertTo-Json @($roleObj) -Compress
  Invoke-RestMethod -Method Post -Uri "$KC/admin/realms/$REALM/users/$userId/role-mappings/realm" -Headers $h -Body $roleArr | Out-Null
  Write-Host "  OK role $role assigned to $uname" -ForegroundColor Green
}

New-KcUser "student1"    "student1@eduai.com"    "Alice"   "Martin" "Student123!"    "student"
New-KcUser "instructor1" "instructor1@eduai.com" "Bob"     "Dupont" "Instructor123!" "instructor"
New-KcUser "admin1"      "admin1@eduai.com"      "Charlie" "Admin"  "Admin123!"      "admin"

Write-Host ""
Write-Host "Keycloak fully configured!" -ForegroundColor Green
Write-Host "  Realm: $REALM  |  Client: elearning-frontend" -ForegroundColor White
Write-Host "  student1 / Student123!" -ForegroundColor White
Write-Host "  instructor1 / Instructor123!" -ForegroundColor White
Write-Host "  admin1 / Admin123!" -ForegroundColor White
