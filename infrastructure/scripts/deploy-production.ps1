# Production Deployment Script for GolfTracker (Windows PowerShell)
# This script automates the production deployment process

$ErrorActionPreference = "Stop"

Write-Host "🚀 GolfTracker Production Deployment" -ForegroundColor Green
Write-Host "======================================"

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command cdk -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CDK not found. Installing..." -ForegroundColor Red
    npm install -g aws-cdk
}

# Check AWS credentials
try {
    $awsIdentity = aws sts get-caller-identity | ConvertFrom-Json
    $AWS_ACCOUNT = $awsIdentity.Account
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "eu-north-1" }

Write-Host "✅ Prerequisites OK" -ForegroundColor Green
Write-Host "   Account: $AWS_ACCOUNT"
Write-Host "   Region: $AWS_REGION"

# Configuration
$DOMAIN_NAME = Read-Host "Enter domain name (leave empty to skip)"
$ALERT_EMAIL = Read-Host "Enter alert email address"

# Step 1: Build Backend
Write-Host "`n📦 Step 1: Building Backend..." -ForegroundColor Yellow
Set-Location ..\backend
npm ci --production
npm run build
Write-Host "✅ Backend built successfully" -ForegroundColor Green

# Step 2: Build Frontend
Write-Host "`n📦 Step 2: Building Frontend..." -ForegroundColor Yellow
Set-Location ..\frontend

# Get API URL
if ([string]::IsNullOrEmpty($env:API_URL)) {
    if (-not [string]::IsNullOrEmpty($DOMAIN_NAME)) {
        $API_URL = "https://api.$DOMAIN_NAME"
    } else {
        $API_URL = Read-Host "Enter API URL (e.g., https://api.golftracker.no)"
    }
} else {
    $API_URL = $env:API_URL
}

# Create production env file
@"
VITE_API_URL=$API_URL
"@ | Out-File -FilePath .env.production -Encoding UTF8

npm ci
npm run build
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Step 3: Bootstrap CDK
Write-Host "`n🔧 Step 3: Bootstrapping AWS CDK..." -ForegroundColor Yellow
Set-Location ..\infrastructure
npm ci

try {
    aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION | Out-Null
    Write-Host "CDK already bootstrapped"
} catch {
    Write-Host "Bootstrapping CDK for the first time..."
    cdk bootstrap "aws://$AWS_ACCOUNT/$AWS_REGION"
}
Write-Host "✅ CDK bootstrapped" -ForegroundColor Green

# Step 4: Deploy Infrastructure
Write-Host "`n🚀 Step 4: Deploying Infrastructure..." -ForegroundColor Yellow

# Check JWT_SECRET
if ([string]::IsNullOrEmpty($env:JWT_SECRET)) {
    Write-Host "⚠️  JWT_SECRET not set. Generating random secret..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $JWT_SECRET = [Convert]::ToBase64String($bytes)
    Write-Host "   Generated JWT_SECRET: $JWT_SECRET"
    Write-Host "   ⚠️  IMPORTANT: Save this secret! You'll need it for redeployments." -ForegroundColor Yellow
} else {
    $JWT_SECRET = $env:JWT_SECRET
}

$env:JWT_SECRET = $JWT_SECRET

# Build context arguments
$CONTEXT_ARGS = @("--context", "environment=production")
if (-not [string]::IsNullOrEmpty($DOMAIN_NAME)) {
    $CONTEXT_ARGS += @("--context", "domainName=$DOMAIN_NAME")
}
if (-not [string]::IsNullOrEmpty($ALERT_EMAIL)) {
    $CONTEXT_ARGS += @("--context", "alertEmail=$ALERT_EMAIL")
}

# Preview changes
Write-Host "`nPreviewing changes..." -ForegroundColor Yellow
& cdk diff @CONTEXT_ARGS

# Confirm deployment
$CONFIRM = Read-Host "Deploy these changes? (yes/no)"
if ($CONFIRM -ne "yes") {
    Write-Host "Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Deploy all stacks
Write-Host "`nDeploying all stacks..." -ForegroundColor Yellow
& cdk deploy --all @CONTEXT_ARGS --require-approval never --outputs-file ./cdk-outputs.json

Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green

# Step 5: Verify Deployment
Write-Host "`n🔍 Step 5: Verifying Deployment..." -ForegroundColor Yellow

# Extract URLs from outputs
$outputs = Get-Content cdk-outputs.json -Raw | ConvertFrom-Json
$API_ENDPOINT = $outputs.GolfTrackerApiStack.ApiUrl
$FRONTEND_URL = $outputs.GolfTrackerFrontendStack.WebsiteUrl
$DASHBOARD_URL = $outputs.GolfTrackerMonitoringStack.DashboardUrl

if ($API_ENDPOINT) {
    Write-Host "Testing API health endpoint..."
    try {
        $response = Invoke-WebRequest -Uri "${API_ENDPOINT}api/health" -UseBasicParsing
        Write-Host "✅ API is healthy" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API health check failed (it may take a few minutes to warm up)" -ForegroundColor Yellow
    }
}

# Step 6: Output Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:"
Write-Host "-------------------"
if ($FRONTEND_URL) {
    Write-Host "🌐 Frontend URL: $FRONTEND_URL"
}
if ($API_ENDPOINT) {
    Write-Host "🔌 API Endpoint: $API_ENDPOINT"
}
if ($DASHBOARD_URL) {
    Write-Host "📈 Monitoring Dashboard: $DASHBOARD_URL"
}
Write-Host ""
Write-Host "📝 Configuration:"
Write-Host "-------------------"
Write-Host "JWT Secret: $JWT_SECRET"
Write-Host ""
Write-Host "🔐 Important Notes:"
Write-Host "-------------------"
Write-Host "1. Save the JWT_SECRET securely"
Write-Host "2. Subscribe to SNS alerts at: $ALERT_EMAIL"
Write-Host "3. Monitor CloudWatch Dashboard for metrics"
Write-Host "4. First deploy may take 5-10 minutes for CloudFront distribution"
Write-Host ""
Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "   - Confirm email subscription for alerts"
Write-Host "   - Update DNS if using custom domain"
Write-Host "   - Test all functionality in production"
Write-Host ""
Write-Host "Happy golfing! ⛳" -ForegroundColor Green
