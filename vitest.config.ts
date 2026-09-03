import { defineConfig } from "vitest/config";

/**
 * Tests get their own config rather than inheriting vite.config.ts, which
 * pulls in the Tailwind and React plugins. The current tests cover pure
 * logic and need neither, and loading the app's plugin chain stalled the
 * runner. Add an environment here if component tests arrive later.
 *
 * The pool is set with --pool=forks in the npm script rather than here:
 * the default "threads" pool never reaches a test on this machine, and
 * the config-file equivalent did not take effect on Vitest 4.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Keep a stuck test from hanging CI indefinitely.
    testTimeout: 60_000,
  },
});
