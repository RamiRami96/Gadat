import { environment } from '../../../environments/environment';

/** Builds an API URL: api('/habits') -> "/api/habits". */
export function api(path: string): string {
  return `${environment.apiBase}${path}`;
}

export function isApiUrl(url: string): boolean {
  return url.startsWith(environment.apiBase + '/');
}
