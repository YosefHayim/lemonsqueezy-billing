# Wizard Skill

The wizard skill provides an interactive CLI setup flow that guides users through configuring their Lemon Squeezy billing integration.

## Overview

The wizard handles the complete setup process including:
- API key validation and selection
- Store and product discovery and selection
- Webhook configuration
- File generation and validation
- Real cycle flow testing

## Architecture

### Components
- `banner.ts` - ASCII art banner display
- `loading.ts` - Loading animation utilities

### Steps
Each step represents a distinct phase of the setup process:
- `api-key.ts` - API key validation and selection
- `store-selection.ts` - Store discovery and selection
- `product-selection.ts` - Product discovery and selection
- `webhook-setup.ts` - Webhook configuration
- `configuration.ts` - Final configuration options
- `generate-files.ts` - File generation and validation

### Utilities
- `validation.ts` - TypeScript and build validation
- `real-cycle.ts` - Real cycle flow testing
- `file-generation.ts` - File generation utilities

## Usage

```typescript
import { runWizard } from './skills/wizard/main';

// Run the complete wizard flow
await runWizard();
```

## Wizard Flow

1. **API Key Setup** - Validate and select API keys
2. **Store Selection** - Discover and select stores
3. **Product Selection** - Discover and select products
4. **Webhook Setup** - Configure webhook endpoints
5. **Configuration** - Set cache paths and other options
6. **File Generation** - Generate configuration files
7. **Validation** - Run validation tests
8. **Real Cycle Test** - Optional real cycle flow testing

## Error Handling

The wizard includes comprehensive error handling:
- API key validation failures
- Store/product discovery errors
- File generation failures
- Validation test failures

## Testing

The wizard includes validation tests that check:
- TypeScript compilation
- Build process success
- Example file syntax
- Billing configuration validity

## Configuration

The wizard generates two main files:
- `billing-config.ts` - Main billing configuration
- `example.ts` - Usage example with Express server

## Extending

To add new wizard steps:
1. Create a new file in `steps/`
2. Export an async function that handles the step
3. Add the step to the main wizard flow in `main.ts`
4. Update the wizard state interface if needed