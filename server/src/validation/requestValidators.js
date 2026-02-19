/**
 * Request validation helpers.
 * Centralizes reusable guards so routes stay thin and consistent.
 */

export function assertRequiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    const err = new Error(`${field} is required`);
    err.statusCode = 400;
    throw err;
  }
  return value.trim();
}

export function assertUuidLike(value, field) {
  assertRequiredString(value, field);
  if (!/^[a-f0-9-]{36}$/i.test(value)) {
    const err = new Error(`${field} must be UUID-like`);
    err.statusCode = 400;
    throw err;
  }
  return value;
}

export function assertEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    const err = new Error(`${field} must be one of: ${allowed.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
}
