import { expect } from '@playwright/test';

type JsonObject = Record<string, unknown>;

export function expectStringField(body: JsonObject, fieldName: string) {
  expect.soft(body, `response should contain "${fieldName}"`).toHaveProperty(fieldName);
  expect.soft(typeof body[fieldName], `${fieldName} should be a string`).toBe('string');
  expect.soft(String(body[fieldName]).length, `${fieldName} should not be empty`).toBeGreaterThan(0);
}

export function expectNumberField(body: JsonObject, fieldName: string) {
  expect.soft(body, `response should contain "${fieldName}"`).toHaveProperty(fieldName);
  expect.soft(typeof body[fieldName], `${fieldName} should be a number`).toBe('number');
}

export function expectEmailField(body: JsonObject, fieldName = 'email') {
  expectStringField(body, fieldName);
  expect.soft(String(body[fieldName]), `${fieldName} should contain @`).toContain('@');
}

export function expectUserShape(body: JsonObject) {
  expectNumberField(body, 'id');
  expectStringField(body, 'name');
  expectStringField(body, 'username');
  expectEmailField(body);
}

export function expectPostShape(body: JsonObject) {
  expectNumberField(body, 'id');
  expectNumberField(body, 'userId');
  expectStringField(body, 'title');
  expectStringField(body, 'body');
}

export function expectArrayLengthAtLeast(items: unknown[], minLength: number, context: string) {
  expect(Array.isArray(items), `${context} should be an array`).toBe(true);
  expect(items.length, `${context} should contain at least ${minLength} items`).toBeGreaterThanOrEqual(minLength);
}
