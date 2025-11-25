# Contributing to Smart Wallet Copilot

Thank you for your interest in contributing! This document provides guidelines and best practices.

## Code of Conduct

Be respectful, inclusive, and collaborative.

## Development Setup

See [README.md](../README.md#quick-start) for initial setup.

## Contribution Workflow

1. **Fork & Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/smart-wallet-copilot.git
   cd smart-wallet-copilot
   ```

2. **Create Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make Changes**

   - Write tests for new features
   - Follow code style (ESLint + Prettier)
   - Add documentation

4. **Test**

   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   ```

5. **Commit**

   ```bash
   git commit -m "feat: add new feature"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/):

   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `test:` Tests
   - `refactor:` Code refactoring
   - `perf:` Performance improvement
   - `chore:` Maintenance

6. **Push & PR**

   ```bash
   git push origin feat/your-feature-name
   ```

   Open a Pull Request with:

   - Clear description
   - Screenshots/GIFs for UI changes
   - Test coverage report

## Code Style

- **TypeScript:** Strict mode enabled
- **React:** Functional components + hooks
- **Formatting:** Prettier (auto-format on save)
- **Linting:** ESLint (zero warnings policy)

## Testing Guidelines

### Unit Tests (Jest)

```typescript
describe("PolicyEngine", () => {
  it("should block infinite approvals to unknown contracts", async () => {
    const result = await engine.evaluateTransaction(tx, context);
    expect(result.allowed).toBe(false);
  });
});
```

### E2E Tests (Playwright)

```typescript
test("should display alert for paused contract", async ({ page }) => {
  await page.goto("http://localhost:3000");
  // ... test steps
  await expect(page.locator('[data-testid="alert-modal"]')).toBeVisible();
});
```

### Coverage Requirements

- Unit: ≥ 70%
- Integration: ≥ 60%
- E2E: Critical paths covered

## Adding a New Policy Rule

1. Create rule file: `packages/policy-engine/src/rules/my-rule.ts`

```typescript
import { PolicyRule, RiskLevel } from '@swc/shared';

export const myRule: PolicyRule = {
  id: 'my-rule-001',
  name: 'My Rule Name',
  description: 'What this rule detects',
  enabled: true,
  riskLevel: RiskLevel.MEDIUM,

  async evaluate(tx, context) {
    // Your logic here
    if (conditionMet) {
      return {
        triggered: true,
        suggestedAction: 'warn',
        evidence: { ... },
        message: 'User-facing warning message'
      };
    }
    return { triggered: false };
  }
};
```

2. Register in engine: `packages/background/src/services/policy-service.ts`

```typescript
import { myRule } from "@swc/policy-engine";
engine.registerRule(myRule);
```

3. Add tests: `packages/policy-engine/src/rules/my-rule.test.ts`

4. Update docs: `docs/RULES.md`

## Adding a Transaction Category

1. Update enum: `packages/shared/src/types.ts`

```typescript
export enum TransactionCategory {
  // ... existing
  MY_NEW_CATEGORY = "my-new-category",
}
```

2. Add classifier: `packages/categorizer/src/index.ts`

```typescript
private categorizeMyNewCategory(tx: Transaction): CategorizationResult {
  return {
    category: TransactionCategory.MY_NEW_CATEGORY,
    confidence: 0.9,
    metadata: { ... }
  };
}
```

3. Add method signature: `packages/shared/src/constants.ts`

```typescript
export const METHOD_SIGNATURES = {
  MY_METHOD: "0x12345678",
  // ...
};
```

4. Update labels & icons: `packages/shared/src/constants.ts`

## UI Component Guidelines

- Use Tailwind utility classes
- Follow existing component patterns
- Add TypeScript prop types
- Include loading & error states
- Make responsive (mobile-first)

Example:

```typescript
interface AlertModalProps {
  alert: Alert;
  onDismiss: () => void;
  onAction: (action: string) => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  alert,
  onDismiss,
  onAction,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal content */}
    </div>
  );
};
```

## Documentation

- Update README for user-facing changes
- Add JSDoc comments for public APIs
- Update ARCHITECTURE.md for system changes
- Create examples in `docs/examples/`

## Performance Optimization

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce expensive operations
- Lazy load heavy dependencies
- Monitor bundle size (keep < 500KB)

## Debugging

### Extension Debugging

1. Load unpacked extension
2. Open `chrome://extensions`
3. Click "Inspect views: background page"
4. Use Chrome DevTools

### React DevTools

Install React DevTools extension for component inspection

### Console Logging

Use Logger class:

```typescript
import { Logger } from "@swc/shared";
const logger = new Logger("MyComponent");
logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message");
```

## Releasing

Maintainers only:

1. Update version: `package.json`
2. Update CHANGELOG.md
3. Tag release: `git tag v0.1.0`
4. Push: `git push --tags`
5. CI/CD builds & publishes

## Getting Help

- **Discord:** https://discord.gg/somnianetwork
- **Issues:** https://github.com/somnia-network/smart-wallet-copilot/issues
- **Discussions:** https://github.com/somnia-network/smart-wallet-copilot/discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
