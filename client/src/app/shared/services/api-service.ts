import { environment } from '../../../environments/environment';

export function api(path: string): string {
  return `${environment.apiBase}${path}`;
}

export function isApiUrl(url: string): boolean {
  return url.startsWith(environment.apiBase + '/');
}
