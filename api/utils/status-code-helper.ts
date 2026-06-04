export function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}
