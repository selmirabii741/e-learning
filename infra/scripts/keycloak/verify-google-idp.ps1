$KC = "http://localhost:8080"
$REALM = "elearning"
$FLOW_ALIAS = "first broker login no review"

$token = (Invoke-RestMethod -Method Post `
    -Uri "$KC/realms/master/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{grant_type="password";client_id="admin-cli";username="admin";password="admin"}).access_token

$headers = @{Authorization="Bearer $token"}

$encoded = [uri]::EscapeDataString($FLOW_ALIAS)
$execs = Invoke-RestMethod -Method Get `
    -Uri "$KC/admin/realms/$REALM/authentication/flows/$encoded/executions" `
    -Headers $headers

Write-Host "=== Executions for flow: $FLOW_ALIAS ===" -ForegroundColor Cyan
$execs | ForEach-Object {
    $color = if ($_.requirement -eq "DISABLED") { "Red" } else { "Green" }
    Write-Host "  $($_.displayName) => $($_.requirement)" -ForegroundColor $color
}

$idp = Invoke-RestMethod -Method Get `
    -Uri "$KC/admin/realms/$REALM/identity-provider/instances/google" `
    -Headers $headers

Write-Host ""
Write-Host "=== Google IdP firstBrokerLoginFlow ===" -ForegroundColor Cyan
Write-Host "  $($idp.firstBrokerLoginFlowAlias)"
