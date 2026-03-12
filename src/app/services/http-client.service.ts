import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  delay,
  firstValueFrom,
  map,
  mergeMap,
  Observable,
  of,
  tap,
  timeout,
} from 'rxjs';
import { ServerService } from './server.service';

@Injectable({ providedIn: 'root' })
export class HttpClientService {
  configLoaded = false;
  serverUrl = '';
  constructor(private http: HttpClient, private serverService: ServerService) {}

  get rootUrl() {
    return this.serverService.rootUrl();
    // return of('http://localhost:3000');
  }

  async getImageUrl(url: string): Promise<string> {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return await firstValueFrom(
      this.rootUrl.pipe(
        map((root) => {
          const baseUrl = root.replace(/\/api\/?$/, '');
          const normalizedUrl = url.replace(/^\/+/, '');
          return `${baseUrl}/${normalizedUrl}`;
        })
      )
    );
  }

  get authHeaders() {
    const token = localStorage.getItem('trip-management-token');
    return {
      Authorization: `Basic ${token}`,
    };
  }

  async authenticate<T>(
    url: string,
    credentials: { username: string; password: string }
  ): Promise<T> {
    const { username, password } = credentials;
    const token = btoa(`${username}:${password}`);
    const header = {
      Authorization: `Basic ${token}`,
    };
    try {
      return await firstValueFrom(
        this.rootUrl.pipe(
          // delay(1000),
          mergeMap((root) =>
            this.http.get<T>(`${root}/${url}`, { headers: header })
          )
        )
      );
    } catch (errorResponse) {
      const errorObject: HttpErrorResponse = errorResponse;
      console.log('errorObject', errorObject);
      if (errorObject.status >= 500) {
        throw 'Server error';
      } else {
        throw errorObject?.error?.message;
      }
    }
  }

  async get<T>(url: string): Promise<T> {
    return await firstValueFrom(
      this.rootUrl.pipe(
        // delay(1000),
        mergeMap((root) =>
          this.http.get<T>(`${root}/${url}`, { headers: this.authHeaders })
        )
      )
    );
  }

  async post(url: string, data): Promise<any> {
    try {
      return await firstValueFrom(
        this.rootUrl.pipe(
          // delay(1000),
          mergeMap((root) =>
            this.http.post(`${root}/${url}`, data, {
              headers: this.authHeaders,
            })
          )
        )
      );
    } catch (errorResponse) {
      const errorObject: HttpErrorResponse = errorResponse;
      if (errorObject.status >= 500) {
        throw 'Server error';
      } else {
        throw errorObject?.error?.message;
      }
    }
  }

  async upload(url: string, data): Promise<any> {
    return await firstValueFrom(
      this.rootUrl.pipe(
        mergeMap((root) =>
          this.http.post(`${root}/${url}`, data, {
            headers: {
              ...this.authHeaders,
            },
          })
        )
      )
    );
  }

  async put(url: string, data): Promise<any> {
    try {
      return await firstValueFrom(
        this.rootUrl.pipe(
          mergeMap((root) =>
            this.http.put(`${root}/${url}`, data, { headers: this.authHeaders })
          )
        )
      );
    } catch (errorResponse) {
      const errorObject: HttpErrorResponse = errorResponse;
      if (errorObject?.status >= 500) {
        throw 'Server error';
      } else {
        throw errorObject?.error?.message;
      }
    }
  }

  async patch(url: string, data): Promise<any> {
    try {
      return await firstValueFrom(
        this.rootUrl.pipe(
          mergeMap((root) =>
            this.http.patch(`${root}/${url}`, data, {
              headers: this.authHeaders,
            })
          )
        )
      );
    } catch (errorResponse) {
      const errorObject: HttpErrorResponse = errorResponse;
      if (errorObject?.status >= 500) {
        throw 'Server error';
      } else {
        throw errorObject?.error?.message;
      }
    }
  }

  async delete(url: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.rootUrl.pipe(
          mergeMap((root) =>
            this.http.delete(`${root}/${url}`, { headers: this.authHeaders })
          )
        )
      );
    } catch (errorResponse) {
      const errorObject: HttpErrorResponse = errorResponse;
      if (errorObject?.status >= 500) {
        throw 'Server error';
      } else {
        throw errorObject?.error?.message;
      }
    }
  }

  async getFile(url: string) {
    return await firstValueFrom(
      this.rootUrl.pipe(
        // delay(1000),
        mergeMap((root) =>
          this.http.get(`${root}/files/${url}`, {
            headers: this.authHeaders,
            responseType: 'blob',
          })
        )
      )
    );
  }
}
