#!/usr/bin/env bash

# Minerva Trequartista - Automated Supabase Deployment Script
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN} Minerva Trequartista - Supabase Automated Deployment ${NC}"
echo -e "${GREEN}====================================================${NC}"

PROJECT_REF="eobatkwbwcdsdqbemrma"

echo -e "\n${YELLOW}[1/3] Pushing SQL Migrations to Supabase (${PROJECT_REF})...${NC}"
npx supabase db push --project-ref "$PROJECT_REF"

echo -e "\n${YELLOW}[2/3] Deploying Supabase Edge Functions...${NC}"
functions=(
  "launch-check-validator"
  "roi-aggregator"
  "webhook-validator"
  "alert-dispatcher"
)

for func in "${functions[@]}"; do
    echo -e "${CYAN}  -> Deploying function: ${func}${NC}"
    npx supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt
done

echo -e "\n${GREEN}[3/3] Supabase Deployment Complete!${NC}"
echo -e "${GREEN}====================================================${NC}"
