import { Injectable, signal } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  constructor(
  ) {}

  makeid(): string {
    let text = '';
    const possible_combinations =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const first_possible_combinations =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 11; i++) {
      const charPosition =
        i === 0
          ? Math.random() * first_possible_combinations.length
          : Math.random() * possible_combinations.length;
      text += possible_combinations.charAt(Math.floor(charPosition));
    }
    return text;
  }
}
