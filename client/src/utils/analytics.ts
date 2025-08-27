// AFL Game Analytics Tracking Utility
import * as Sentry from '@sentry/react';

// Analytics utility class
class Analytics {
  private isInitialized = false;
  private userId: string | null = null;
  private firstVisitDate: string | null = null;

  constructor() {
    this.init();
  }

  // Initialize analytics tools
  private init() {
    this.initGA4();
    this.initSentry();
    this.setupUserTracking();
    this.isInitialized = true;
  }

  // Initialize Google Analytics 4
  private initGA4() {
    // GA4 configuration - replace with your GA4 measurement ID
    const GA4_MEASUREMENT_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';
    
    // Add GA4 script
    if (typeof window !== 'undefined' && !window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA4_MEASUREMENT_ID}', {
          page_title: 'AFL Player Guesser',
          custom_map: {'custom_parameter_1': 'user_type'}
        });
      `;
      document.head.appendChild(script2);
    }
  }

  // Initialize Sentry error monitoring
  private initSentry() {
    const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
    
    if (SENTRY_DSN && typeof window !== 'undefined') {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          new Sentry.BrowserTracing(),
        ],
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event) {
          // Filter out unimportant errors in production
          if (event.exception) {
            const error = event.exception.values?.[0];
            if (error?.type === 'ChunkLoadError' || error?.value?.includes('Loading chunk')) {
              return null; // Ignore chunk loading errors
            }
          }
          return event;
        }
      });
    }
  }

  // Setup user tracking
  private setupUserTracking() {
    if (typeof window === 'undefined') return;

    // Get or create user ID
    this.userId = localStorage.getItem('afl_user_id') || this.generateUserId();
    localStorage.setItem('afl_user_id', this.userId);

    // Record first visit date
    this.firstVisitDate = localStorage.getItem('afl_first_visit') || new Date().toISOString().split('T')[0];
    localStorage.setItem('afl_first_visit', this.firstVisitDate);

    // Set Sentry user info
    Sentry.setUser({
      id: this.userId,
      ip_address: '{{auto}}'
    });
  }

  // Generate unique user ID
  private generateUserId(): string {
    return 'afl_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Send event to GA4
  private sendGA4Event(eventName: string, parameters: Record<string, any> = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      const eventData = {
        ...parameters,
        user_id: this.userId,
        timestamp: Date.now()
      };
      
      window.gtag('event', eventName, eventData);
      console.log('[Analytics] GA4 Event:', eventName, eventData);
    }
  }

  // ======================
  // Core Metrics Tracking Methods
  // ======================

  // 1. DAU - Daily Active Users tracking
  trackDAU() {
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = localStorage.getItem('afl_last_active');
    
    if (lastActiveDate !== today) {
      localStorage.setItem('afl_last_active', today);
      
      this.sendGA4Event('daily_active_user', {
        event_category: 'user_engagement',
        date: today,
        is_new_day: true
      });

      console.log('[Analytics] DAU tracked for:', today);
    }
  }

  // 2. Retention rate tracking
  trackRetention() {
    if (!this.firstVisitDate || !this.userId) return;

    const today = new Date().toISOString().split('T')[0];
    const firstVisit = new Date(this.firstVisitDate);
    const currentVisit = new Date(today);
    const daysSinceFirst = Math.floor((currentVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));

    // Send data only at key retention milestones
    if ([1, 7, 30].includes(daysSinceFirst)) {
      this.sendGA4Event('user_retention', {
        event_category: 'user_lifecycle',
        days_since_first_visit: daysSinceFirst,
        first_visit_date: this.firstVisitDate,
        retention_milestone: `day_${daysSinceFirst}`
      });

      console.log(`[Analytics] Day ${daysSinceFirst} retention tracked`);
    }
  }

  // 3. Game start event
  trackGameStart(gameMode: 'solo' | 'random' | 'private', additionalData: Record<string, any> = {}) {
    const isFirstGame = !localStorage.getItem('afl_has_played');
    if (isFirstGame) {
      localStorage.setItem('afl_has_played', 'true');
    }

    this.sendGA4Event('game_start', {
      event_category: 'game_interaction',
      game_mode: gameMode,
      is_first_game: isFirstGame,
      session_id: this.getSessionId(),
      ...additionalData
    });

    console.log('[Analytics] Game started:', gameMode);
  }

  // 4. Game complete event
  trackGameComplete(gameData: {
    gameMode: string;
    result: 'win' | 'lose';
    guessesUsed: number;
    maxGuesses: number;
    duration: number; // milliseconds
    targetPlayer?: string;
  }) {
    this.sendGA4Event('game_complete', {
      event_category: 'game_interaction',
      game_mode: gameData.gameMode,
      game_result: gameData.result,
      guesses_used: gameData.guessesUsed,
      max_guesses: gameData.maxGuesses,
      completion_rate: (gameData.guessesUsed / gameData.maxGuesses * 100).toFixed(1),
      duration_seconds: Math.round(gameData.duration / 1000),
      target_player: gameData.targetPlayer,
      session_id: this.getSessionId()
    });

    // Update average games per user statistics
    this.updateGameCount();

    console.log('[Analytics] Game completed:', gameData);
  }

  // 5. Battle related events
  trackBattleStart(battleData: {
    mode: 'random' | 'private';
    roomCode?: string;
    opponentId?: string;
    seriesBestOf?: number;
  }) {
    this.sendGA4Event('battle_start', {
      event_category: 'battle_interaction',
      battle_mode: battleData.mode,
      room_code: battleData.roomCode,
      opponent_id: battleData.opponentId,
      series_best_of: battleData.seriesBestOf,
      session_id: this.getSessionId()
    });
  }

  trackBattleComplete(battleData: {
    mode: 'random' | 'private';
    result: 'win' | 'lose' | 'disconnect';
    duration: number;
    guessesUsed: number;
    opponentGuesses?: number;
  }) {
    this.sendGA4Event('battle_complete', {
      event_category: 'battle_interaction',
      battle_mode: battleData.mode,
      battle_result: battleData.result,
      duration_seconds: Math.round(battleData.duration / 1000),
      guesses_used: battleData.guessesUsed,
      opponent_guesses: battleData.opponentGuesses,
      session_id: this.getSessionId()
    });

    // Battle count statistics
    this.updateBattleCount();
  }

  // 6. 匹配系统事件
  trackMatchmakingStart() {
    this.sendGA4Event('matchmaking_start', {
      event_category: 'matchmaking',
      timestamp: Date.now()
    });
  }

  trackMatchmakingSuccess(waitTime: number) {
    this.sendGA4Event('matchmaking_success', {
      event_category: 'matchmaking',
      wait_time_seconds: Math.round(waitTime / 1000),
      success: true
    });
  }

  trackMatchmakingFailed(reason: string, waitTime: number) {
    this.sendGA4Event('matchmaking_failed', {
      event_category: 'matchmaking',
      failure_reason: reason,
      wait_time_seconds: Math.round(waitTime / 1000),
      success: false
    });
  }

  // 7. 用户行为事件
  trackUserAction(action: string, data: Record<string, any> = {}) {
    this.sendGA4Event('user_action', {
      event_category: 'user_behavior',
      action_type: action,
      ...data,
      session_id: this.getSessionId()
    });
  }

  // 8. 错误追踪
  trackError(error: Error, context: Record<string, any> = {}) {
    // Send to Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'afl_game',
        ...context.tags
      },
      extra: {
        user_id: this.userId,
        session_id: this.getSessionId(),
        ...context.extra
      }
    });

    // Also send to GA4
    this.sendGA4Event('error_occurred', {
      event_category: 'error_tracking',
      error_name: error.name,
      error_message: error.message.substring(0, 100), // Limit length
      error_stack: error.stack?.substring(0, 200),
      context: JSON.stringify(context).substring(0, 100)
    });

    console.error('[Analytics] Error tracked:', error, context);
  }

  // ======================
  // Helper Methods
  // ======================

  // Get session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('afl_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('afl_session_id', sessionId);
    }
    return sessionId;
  }

  // Update game count statistics
  private updateGameCount() {
    const today = new Date().toISOString().split('T')[0];
    const todayGamesKey = `afl_games_${today}`;
    const todayGames = parseInt(localStorage.getItem(todayGamesKey) || '0') + 1;
    localStorage.setItem(todayGamesKey, todayGames.toString());

    // Total game count
    const totalGames = parseInt(localStorage.getItem('afl_total_games') || '0') + 1;
    localStorage.setItem('afl_total_games', totalGames.toString());
  }

  // Update battle count statistics
  private updateBattleCount() {
    const today = new Date().toISOString().split('T')[0];
    const todayBattlesKey = `afl_battles_${today}`;
    const todayBattles = parseInt(localStorage.getItem(todayBattlesKey) || '0') + 1;
    localStorage.setItem(todayBattlesKey, todayBattles.toString());

    // Total battle count
    const totalBattles = parseInt(localStorage.getItem('afl_total_battles') || '0') + 1;
    localStorage.setItem('afl_total_battles', totalBattles.toString());
  }

  // Get user statistics (for debugging)
  getUserStats() {
    const today = new Date().toISOString().split('T')[0];
    return {
      userId: this.userId,
      firstVisitDate: this.firstVisitDate,
      todayGames: parseInt(localStorage.getItem(`afl_games_${today}`) || '0'),
      todayBattles: parseInt(localStorage.getItem(`afl_battles_${today}`) || '0'),
      totalGames: parseInt(localStorage.getItem('afl_total_games') || '0'),
      totalBattles: parseInt(localStorage.getItem('afl_total_battles') || '0')
    };
  }
}

// Declare global gtag type
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Create singleton instance
const analytics = new Analytics();

export default analytics;

// Export types
export interface GameCompleteData {
  gameMode: string;
  result: 'win' | 'lose';
  guessesUsed: number;
  maxGuesses: number;
  duration: number;
  targetPlayer?: string;
}

export interface BattleData {
  mode: 'random' | 'private';
  result?: 'win' | 'lose' | 'disconnect';
  duration?: number;
  guessesUsed?: number;
  opponentGuesses?: number;
  roomCode?: string;
  opponentId?: string;
  seriesBestOf?: number;
}