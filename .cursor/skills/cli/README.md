# CLI Skill

The CLI skill provides command-line interface functionality for interacting with the billing system.

## Overview

The CLI skill handles all command-line operations including:
- Interactive wizard setup
- Configuration validation
- File generation
- Testing and validation

## Architecture

### Commands
- Individual CLI command implementations
- Command-line argument parsing
- Command execution logic

### Utilities
- CLI-specific helpers and utilities
- Argument validation
- Output formatting

## Usage

```typescript
// Import CLI commands
import { setupCommand } from './skills/cli/commands/setup';

// Execute a command
await setupCommand(args);
```

## Available Commands

### Setup Command
- Runs the interactive wizard
- Validates configuration
- Generates necessary files
- Runs validation tests

## Command Structure

Each command follows a consistent pattern:
1. Parse command-line arguments
2. Validate inputs
3. Execute command logic
4. Handle errors and output results

## Extending

To add new CLI commands:
1. Create a new file in `commands/`
2. Export a function that handles the command
3. Add argument parsing and validation
4. Implement the command logic
5. Add error handling and output formatting