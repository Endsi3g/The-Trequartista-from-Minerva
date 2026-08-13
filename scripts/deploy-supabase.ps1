# Minerva Trequartista - Automated Supabase Deployment Script

Write-Host "====================================================" -ForegroundColor Green
Write-Host " Minerva Trequartista - Supabase Automated Deployment " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

$PROJECT_REF = "eobatkwbwcdsdqbemrma"

Write-Host "[1/3] Pushing SQL Migrations to Supabase ($PROJECT_REF)..." -ForegroundColor Yellow
npx supabase db push --project-ref $PROJECT_REF

Write-Host "[2/3] Deploying Supabase Edge Functions..." -ForegroundColor Yellow
$functions = @(
  "launch-check-validator",
  "roi-aggregator",
  "webhook-validator",
  "alert-dispatcher"
)

foreach ($func in $functions) {
    Write-Host "  -> Deploying function: $func" -ForegroundColor Cyan
    npx supabase functions deploy $func --project-ref $PROJECT_REF --no-verify-jwt
}

Write-Host "[3/3] Supabase Deployment Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
