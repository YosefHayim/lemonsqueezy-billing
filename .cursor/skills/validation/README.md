# Validation Skill

The validation skill provides testing and validation functionality to ensure the billing system works correctly.

## Overview

The validation skill handles all validation and testing operations including:
- TypeScript compilation validation
- Build process validation
- Example file syntax validation
- Billing configuration validation
- Real cycle flow testing

## Architecture

### Tests
- Validation test implementations
- Test execution logic
- Test result reporting

### Utilities
- Validation helpers and utilities
- Test configuration
- Error handling for validation failures

## Usage

```typescript
// Import validation utilities
import { runValidationTests } from './skills/validation/utils/tests';

// Run all validation tests
await runValidationTests();
```

## Validation Tests

### TypeScript Compilation
- Validates that all TypeScript files compile without errors
- Ensures type safety and correctness

### Build Process
- Validates that the build process completes successfully
- Checks for build artifacts and proper output

### Example File Syntax
- Validates that generated example files have correct syntax
- Ensures example files can be executed

### Billing Configuration
- Validates that billing configuration files are properly structured
- Checks for required exports and configuration options

### Real Cycle Flow
- Tests the complete billing flow with real API calls
- Validates store listing, product listing, and checkout creation
- Provides feedback on sandbox vs live API key usage

## Test Execution

Validation tests follow a consistent pattern:
1. Execute the validation test
2. Report success or failure
3. Provide detailed error information if tests fail
4. Suggest next steps for fixing issues

## Error Handling

The validation skill includes comprehensive error handling:
- Detailed error messages for each test failure
- Suggestions for fixing common issues
- Graceful handling of API errors and timeouts

## Extending

To add new validation tests:
1. Create a new test function in `tests/`
2. Export the test function
3. Add the test to the main validation flow
4. Update error handling and reporting as needed