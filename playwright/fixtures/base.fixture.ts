import { test as base } from '@playwright/test';

export const test = base.extend({
  // custom fixtures can be added here
});

export { expect } from '@playwright/test';