# Install Test Dependencies

## Quick Install

The test dependencies are already listed in `package.json`. Simply run:

```bash
npm install
```

This will install:
- `jest` - Test framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `@types/jest` - TypeScript types for Jest
- `@playwright/test` - E2E testing framework

## Verify Installation

After installation, verify everything works:

```bash
# Type check (should pass)
npm run typecheck

# Run unit tests
npm test

# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

## TypeScript Errors in IDE

You may see TypeScript errors in test files before running `npm install`. This is normal and expected. The errors will disappear after:

1. Running `npm install`
2. Reloading your IDE/editor

## Note

Test files are excluded from the main TypeScript compilation (in `tsconfig.json`), so these errors won't affect your production build or `npm run build` command.

## If You Don't Want to Install Test Dependencies Yet

The application will build and run fine without test dependencies:

```bash
npm run build  # Works fine
npm run start  # Works fine
npm run dev    # Works fine
```

You can install test dependencies later when you're ready to write/run tests.
