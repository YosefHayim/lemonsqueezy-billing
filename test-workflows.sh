#!/bin/bash

# Test script for lemonsqueezy-billing workflows
# Run from project root: ./test-workflows.sh

set -e

echo "🍋 Lemon Squeezy Billing - Test Workflows"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run tests
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    
    echo -e "${YELLOW}Running: ${test_name}${NC}"
    if eval "$test_cmd"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating example .env file...${NC}"
    cat > .env << 'EOF'
# Lemon Squeezy API Keys (get from https://app.lemonsqueezy.com/settings/api)
# LS_TEST_API_KEY=your_test_api_key_here
# LS_LIVE_API_KEY=your_live_api_key_here

# Webhook Secret (optional)
# LS_WEBHOOK_SECRET=your_webhook_secret_here
EOF
    echo -e "${YELLOW}Please fill in your API keys in .env file${NC}"
    echo ""
fi

# Run typecheck
run_test "TypeScript Type Check" "pnpm typecheck"

# Run build
run_test "Build Package" "pnpm build"

# Run validation (if configured)
if [ -n "$LS_TEST_API_KEY" ] || [ -n "$LS_LIVE_API_KEY" ]; then
    run_test "Validation Script" "pnpm validate"
else
    echo -e "${YELLOW}Skipping validation (no API key configured)${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "All tests passed! ✅"
echo "==========================================${NC}"
