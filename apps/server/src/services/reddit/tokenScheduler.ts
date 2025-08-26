/**
 * Reddit Token Refresh Scheduler
 * Automatically refreshes Reddit OAuth tokens before expiration
 */

import winston from 'winston';
import { RedditAuthService } from './auth.js';
import { logger } from '../../utils/logger.js';

export class RedditTokenScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval: number;

  constructor(
    private readonly authService: RedditAuthService,
    private readonly logger: winston.Logger,
    checkIntervalMinutes: number = 30 // Check every 30 minutes
  ) {
    this.checkInterval = checkIntervalMinutes * 60 * 1000;
  }

  /**
   * Start the token refresh scheduler
   */
  start(): void {
    if (this.intervalId) {
      this.logger.warn('Token scheduler already running');
      return;
    }

    this.logger.info('Starting Reddit token refresh scheduler', {
      checkIntervalMinutes: this.checkInterval / (60 * 1000),
    });

    // Check immediately on start
    this.checkAndRefreshToken();

    // Then check at regular intervals
    this.intervalId = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.checkInterval);
  }

  /**
   * Stop the token refresh scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Reddit token refresh scheduler stopped');
    }
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  private async checkAndRefreshToken(): Promise<void> {
    try {
      this.logger.debug('Checking Reddit token status');

      const isAuthenticated = await this.authService.isAuthenticated();
      if (!isAuthenticated) {
        this.logger.warn('No Reddit authentication token available');
        return;
      }

      // This will automatically refresh the token if needed
      await this.authService.getValidAccessToken();

      this.logger.debug('Reddit token check completed');
    } catch (error) {
      this.logger.error('Failed to check/refresh Reddit token', { error });
    }
  }

  /**
   * Force token refresh now (for manual trigger)
   */
  async forceRefresh(): Promise<boolean> {
    try {
      this.logger.info('Forcing Reddit token refresh');
      await this.checkAndRefreshToken();
      return true;
    } catch (error) {
      this.logger.error('Failed to force refresh Reddit token', { error });
      return false;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; checkIntervalMinutes: number } {
    return {
      running: this.intervalId !== null,
      checkIntervalMinutes: this.checkInterval / (60 * 1000),
    };
  }
}
