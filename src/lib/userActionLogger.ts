import { UserAction, UserActionType, SessionData } from '../types/analytics';

export class UserActionLogger {
  private sessionId: string;
  private sessionStartTime: number;
  private userActions: UserAction[] = [];
  private currentUrl: string = '';
  private isLogging: boolean = false;
  private sessionData: SessionData;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.sessionData = {
      sessionId,
      startTime: this.sessionStartTime,
      duration: 0,
      userActions: [],
      analytics: {
        sessionDuration: 0,
        interactions: 0,
        sentiment: 0,
        heatmapData: [],
        userJourney: [],
        userActions: []
      }
    };
  }

  /**
   * Start logging user actions
   */
  startLogging(): void {
    this.isLogging = true;
    this.setupGlobalEventListeners();
    console.log('User action logging started');
  }

  /**
   * Stop logging user actions
   */
  stopLogging(): void {
    this.isLogging = false;
    this.removeGlobalEventListeners();
    this.sessionData.endTime = Date.now();
    this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;
    console.log('User action logging stopped');
  }

  /**
   * Log a user action
   */
  logAction(
    type: UserActionType,
    data?: Record<string, unknown>,
    coordinates?: { x: number; y: number },
    element?: string
  ): void {
    if (!this.isLogging) return;

    const action: UserAction = {
      id: this.generateActionId(),
      type,
      timestamp: Date.now(),
      url: this.currentUrl,
      coordinates,
      element,
      data,
      sessionId: this.sessionId
    };

    this.userActions.push(action);
    this.sessionData.userActions.push(action);
    this.sessionData.analytics.userActions.push(action);

    // Update analytics
    this.sessionData.analytics.interactions = this.userActions.length;

    console.log('User action logged:', action);
  }

  /**
   * Set current URL for context
   */
  setCurrentUrl(url: string): void {
    this.currentUrl = url;
  }

  /**
   * Get all logged actions
   */
  getUserActions(): UserAction[] {
    return [...this.userActions];
  }

  /**
   * Get session data
   */
  getSessionData(): SessionData {
    return { ...this.sessionData };
  }

  /**
   * Get analytics data
   */
  getAnalyticsData() {
    return { ...this.sessionData.analytics };
  }

  /**
   * Clear all logged actions
   */
  clearActions(): void {
    this.userActions = [];
    this.sessionData.userActions = [];
    this.sessionData.analytics.userActions = [];
  }

  /**
   * Export session data as JSON
   */
  exportSessionData(): string {
    return JSON.stringify(this.sessionData, null, 2);
  }

  /**
   * Setup global event listeners for automatic tracking
   */
  private setupGlobalEventListeners(): void {
    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll.bind(this), true);
    
    // Mouse movement tracking (throttled)
    let mouseMoveTimeout: NodeJS.Timeout;
    document.addEventListener('mousemove', (e) => {
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        this.handleMouseMove(e);
      }, 100); // Throttle to 100ms
    }, true);

    // Keyboard tracking
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    
    // Focus/blur tracking
    document.addEventListener('focusin', this.handleFocus.bind(this), true);
    document.addEventListener('focusout', this.handleBlur.bind(this), true);
    
    // Form submission tracking
    document.addEventListener('submit', this.handleFormSubmit.bind(this), true);
    
    // Window resize tracking
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Remove global event listeners
   */
  private removeGlobalEventListeners(): void {
    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('scroll', this.handleScroll.bind(this), true);
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this), true);
    document.removeEventListener('keydown', this.handleKeydown.bind(this), true);
    document.removeEventListener('focusin', this.handleFocus.bind(this), true);
    document.removeEventListener('focusout', this.handleBlur.bind(this), true);
    document.removeEventListener('submit', this.handleFormSubmit.bind(this), true);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const coordinates = { x: event.clientX, y: event.clientY };
    
    this.logAction('click', {
      target: target.tagName,
      targetId: target.id,
      targetClass: target.className,
      button: event.button
    }, coordinates, target.tagName);
  }

  /**
   * Handle scroll events
   */
  private handleScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop || window.scrollY;
    const scrollLeft = target.scrollLeft || window.scrollX;
    
    this.logAction('scroll', {
      scrollTop,
      scrollLeft,
      target: target.tagName
    });
  }

  /**
   * Handle mouse movement
   */
  private handleMouseMove(event: MouseEvent): void {
    const coordinates = { x: event.clientX, y: event.clientY };
    
    this.logAction('mouse_move', {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    }, coordinates);
  }

  /**
   * Handle keyboard events
   */
  private handleKeydown(event: KeyboardEvent): void {
    // Only log specific keys for privacy
    const loggableKeys = ['Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    if (loggableKeys.includes(event.key)) {
      this.logAction('keypress', {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey
      });
    }
  }

  /**
   * Handle focus events
   */
  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    this.logAction('focus', {
      target: target.tagName,
      targetId: target.id,
      targetClass: target.className
    }, undefined, target.tagName);
  }

  /**
   * Handle blur events
   */
  private handleBlur(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    this.logAction('blur', {
      target: target.tagName,
      targetId: target.id,
      targetClass: target.className
    }, undefined, target.tagName);
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit(event: Event): void {
    const target = event.target as HTMLFormElement;
    
    this.logAction('form_submit', {
      formId: target.id,
      formAction: target.action,
      formMethod: target.method
    }, undefined, 'FORM');
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.logAction('resize', {
      width: window.innerWidth,
      height: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    });
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `${this.sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 