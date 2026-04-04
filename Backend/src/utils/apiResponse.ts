export function success<T>(data: T, message = "OK") {
  return { success: true as const, message, data };
}

export function fail(message: string, statusCode = 400) {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}
