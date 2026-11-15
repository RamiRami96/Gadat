/** Routes the shared guards and interceptors send people to. */
export const UNLOCK_URL = '/unlock';
export const HOME_URL = '/';

/** HTTP methods that change data. The server only accepts them as JSON (CSRF defence). */
export const MUTATING_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const TOAST_DURATION_MS = 4000;

/** ISO weekdays, Monday = 1 ... Sunday = 7. */
export const ALL_WEEKDAYS: readonly number[] = [1, 2, 3, 4, 5, 6, 7];
