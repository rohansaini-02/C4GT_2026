# Structured Logger Utility (PoC)

A standalone, decoupled Centralized Structured Logger for the TAP Buddy application.

## Features
- **Context Tagging**: Initialize with a context string (e.g. `AuthModule`) to easily trace logs.
- **Severity Filtering**: Support for `DEBUG`, `INFO`, `WARN`, and `ERROR` levels with global and instance-level thresholds.
- **Pluggable Transports**: By default, outputs beautifully formatted logs to the console. Can easily inject custom transports (e.g., Sentry, Crashlytics) for production environments via `Logger.setGlobalTransport()`.
- **Zero Dependencies**: Core logic is implemented with pure TypeScript.

## Quickstart

```typescript
import { Logger } from 'structured-logger';

// Initialize with context
const logger = new Logger('SyncEngine');

logger.info('Starting sync process...', { userId: '123' });
logger.error('Failed to connect to server');
```

## Running Tests
This package is fully covered by a Jest test suite (100% coverage).
```bash
npm install
npm test
```
