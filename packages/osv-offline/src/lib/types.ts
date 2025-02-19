interface Success { success: true }
interface Failure { success: false; error: Error }
export type Result = Success | Failure;

export function success(): Success {
  return { success: true };
}

export function failure(error: Error): Failure {
  return { success: false, error };
}
