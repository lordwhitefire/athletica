// Shared interaction state primitives.
// Used by admin list / editor pages (ROLL-06, ROLL-07) and analytics (ROLL-08).

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  state: ActionState;
}

export function createAsyncState<T>(): AsyncState<T> {
  return { data: null, error: null, state: 'idle' };
}