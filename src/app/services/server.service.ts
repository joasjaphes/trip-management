import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, map, tap, catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServerService {
  configLoaded = false;
  serverUrl = '';
  constructor(private http: HttpClient) {}

  rootUrl() {
    return this.configLoaded
      ? of(this.serverUrl)
      : this.http.get('config.json').pipe(
          map((res) => res['server']['url']),
          tap((url) => {
            console.log('Server URL loaded', url);
            this.serverUrl = url;
            this.configLoaded = true;
          }),
          catchError((err) => {
            console.error('Error loading config.json', err);
            return err;
          })
        );
  }
}
