#!/usr/bin/env bash

# Production Deployment Script for GolfTracker
# This script automates the production deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 GolfTracker Production Deployment${NC}"
echo "======================================"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-eu-north-1}

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo "   Account: $AWS_ACCOUNT"
echo "   Region: $AWS_REGION"

# Configuration
read -p "Enter domain name (leave empty to skip): " DOMAIN_NAME
read -p "Enter alert email address: " ALERT_EMAIL

# Step 1: Build Backend
echo -e "\n${YELLOW}📦 Step 1: Building Backend...${NC}"
cd ../backend
npm ci --production
npm run build
echo -e "${GREEN}✅ Backend built successfully${NC}"

# Step 2: Build Frontend
echo -e "\n${YELLOW}📦 Step 2: Building Frontend...${NC}"
cd ../frontend

# Get API URL from context or prompt
if [ -z "$API_URL" ]; then
    if [ -n "$DOMAIN_NAME" ]; then
        API_URL="https://api.$DOMAIN_NAME"
    else
        read -p "Enter API URL (e.g., https://api.golftracker.no): " API_URL
    fi
fi

# Create production env file
cat > .env.production << EOF
VITE_API_URL=$API_URL
EOF

npm ci
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 3: Bootstrap CDK (if needed)
echo -e "\n${YELLOW}🔧 Step 3: Bootstrapping AWS CDK...${NC}"
cd ../infrastructure
npm ci

if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $AWS_REGION &> /dev/null; then
    echo "Bootstrapping CDK for the first time..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
else
    echo "CDK already bootstrapped"
fi
echo -e "${GREEN}✅ CDK bootstrapped${NC}"

# Step 4: Deploy Infrastructure
echo -e "\n${YELLOW}🚀 Step 4: Deploying Infrastructure...${NC}"

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET not set. Generating random secret...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    echo "   Generated JWT_SECRET: $JWT_SECRET"
    echo -e "${YELLOW}   ⚠️  IMPORTANT: Save this secret! You'll need it for redeployments.${NC}"
fi

export JWT_SECRET

# Build context arguments
CONTEXT_ARGS="--context environment=production"
if [ -n "$DOMAIN_NAME" ]; then
    CONTEXT_ARGS="$CONTEXT_ARGS --context domainName=$DOMAIN_NAME"
fi
if [ -n "$ALERT_EMAIL" ]; then
    CONTEXT_ARGS="$CONTEXT_ARGS --context alertEmail=$ALERT_EMAIL"
fi

# Preview changes
echo -e "\n${YELLOW}Previewing changes...${NC}"
cdk diff $CONTEXT_ARGS

# Confirm deployment
read -p "Deploy these changes? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# Deploy all stacks
echo -e "\n${YELLOW}Deploying all stacks...${NC}"
cdk deploy --all $CONTEXT_ARGS --require-approval never --outputs-file ./cdk-outputs.json

echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"

# Step 5: Verify Deployment
echo -e "\n${YELLOW}🔍 Step 5: Verifying Deployment...${NC}"

# Extract API URL from outputs
API_ENDPOINT=$(jq -r '.GolfTrackerApiStack.ApiUrl' cdk-outputs.json 2>/dev/null || echo "")
FRONTEND_URL=$(jq -r '.GolfTrackerFrontendStack.WebsiteUrl' cdk-outputs.json 2>/dev/null || echo "")
DASHBOARD_URL=$(jq -r '.GolfTrackerMonitoringStack.DashboardUrl' cdk-outputs.json 2>/dev/null || echo "")

if [ -n "$API_ENDPOINT" ]; then
    echo "Testing API health endpoint..."
    if curl -f "${API_ENDPOINT}api/health" &> /dev/null; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check failed (it may take a few minutes to warm up)${NC}"
    fi
fi

# Step 6: Output Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "-------------------"
if [ -n "$FRONTEND_URL" ]; then
    echo "🌐 Frontend URL: $FRONTEND_URL"
fi
if [ -n "$API_ENDPOINT" ]; then
    echo "🔌 API Endpoint: $API_ENDPOINT"
fi
if [ -n "$DASHBOARD_URL" ]; then
    echo "📈 Monitoring Dashboard: $DASHBOARD_URL"
fi
echo ""
echo "📝 Configuration:"
echo "-------------------"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "🔐 Important Notes:"
echo "-------------------"
echo "1. Save the JWT_SECRET securely"
echo "2. Subscribe to SNS alerts at: $ALERT_EMAIL"
echo "3. Monitor CloudWatch Dashboard for metrics"
echo "4. First deploy may take 5-10 minutes for CloudFront distribution"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   - Confirm email subscription for alerts"
echo "   - Update DNS if using custom domain"
echo "   - Test all functionality in production"
echo ""
echo -e "${GREEN}Happy golfing! ⛳${NC}"
