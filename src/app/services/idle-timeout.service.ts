import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, fromEvent, merge } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class IdleTimeoutService {
  private readonly idleTimeoutMs = 10 * 60 * 1000;
  private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  private activitySubscription: Subscription | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  start(): void {
    if (this.isRunning || typeof document === 'undefined') {
      return;
    }

    this.isRunning = true;
    this.activitySubscription = merge(
      ...this.activityEvents.map((eventName) => fromEvent(document, eventName)),
    ).subscribe(() => this.resetTimer());

    this.resetTimer();
  }

  stop(): void {
    this.isRunning = false;
    this.activitySubscription?.unsubscribe();
    this.activitySubscription = null;
    this.clearTimer();
  }

  private resetTimer(): void {
    this.clearTimer();
    this.timeoutHandle = setTimeout(() => {
      void this.handleTimeout();
    }, this.idleTimeoutMs);
  }

  private clearTimer(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private async handleTimeout(): Promise<void> {
    this.stop();

    if (!this.userService.isAuthenticated()) {
      return;
    }

    await this.userService.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}