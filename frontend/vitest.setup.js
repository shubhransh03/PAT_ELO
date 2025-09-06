import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Minimal fetch mock for API calls in tests; components call api.js functions which use fetch
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Reset fetch mocks between tests
afterEach(() => {
  if (global.fetch && 'mockClear' in global.fetch) {
    global.fetch.mockClear();
  }
});
