import { ScreenRecordingData, RecordingStatus } from '../types/analytics';

export class ScreenRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];
  private currentRecording: ScreenRecordingData | null = null;
  private sessionId: string;
  private targetElement: HTMLElement | null = null;
  private recordingIndicator: HTMLElement | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Set the target element to record (e.g., iframe)
   */
  setTargetElement(element: HTMLElement | null): void {
    this.targetElement = element;
  }

  /**
   * Start screen recording
   */
  async startRecording(): Promise<ScreenRecordingData> {
    try {
      if (this.targetElement) {
        // Create a visual overlay to highlight the recording area
        const iframe = this.targetElement as HTMLIFrameElement;
        const rect = iframe.getBoundingClientRect();
        
        // Create a visual indicator that recording is active
        const recordingIndicator = document.createElement('div');
        recordingIndicator.style.position = 'absolute';
        recordingIndicator.style.top = `${rect.top}px`;
        recordingIndicator.style.left = `${rect.left}px`;
        recordingIndicator.style.width = `${rect.width}px`;
        recordingIndicator.style.height = `${rect.height}px`;
        recordingIndicator.style.border = '2px solid #10b981';
        recordingIndicator.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        recordingIndicator.style.pointerEvents = 'none';
        recordingIndicator.style.zIndex = '9999';
        recordingIndicator.innerHTML = `
          <div style="position: absolute; top: 5px; right: 5px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace;">
            REC
          </div>
        `;
        document.body.appendChild(recordingIndicator);
        
        // Store reference to remove later
        this.recordingIndicator = recordingIndicator;
      }
      
      // Use screen recording but automatically focus on the iframe area
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Disable audio for privacy
      });
      
      console.log('Automatic recording started with visual indicator');

      // Configure recording options
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      };

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      // Set up event handlers
      this.setupRecordingHandlers();

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      // Create recording data
      const videoTrack = this.mediaStream?.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      
      this.currentRecording = {
        sessionId: this.sessionId,
        startTime: Date.now(),
        duration: 0,
        status: 'recording',
        metadata: {
          resolution: {
            width: settings?.width && typeof settings.width === 'number' ? settings.width : 1920,
            height: settings?.height && typeof settings.height === 'number' ? settings.height : 1080
          },
          frameRate: 30,
          quality: 'medium',
          format: 'webm'
        }
      };

      console.log('Screen recording started');
      return this.currentRecording;

    } catch (error) {
      console.error('Failed to start screen recording:', error);
      throw new Error('Screen recording permission denied or not supported');
    }
  }

  /**
   * Stop screen recording
   */
  async stopRecording(): Promise<ScreenRecordingData | null> {
    if (!this.mediaRecorder || !this.currentRecording) {
      return null;
    }

    return new Promise((resolve) => {
      const handleStop = () => {
        if (this.currentRecording) {
          this.currentRecording.endTime = Date.now();
          this.currentRecording.duration = this.currentRecording.endTime - this.currentRecording.startTime;
          this.currentRecording.status = 'stopped';

          // Create blob URL for the recording
          const blob = new Blob(this.recordingChunks, { type: 'video/webm' });
          this.currentRecording.recordingUrl = URL.createObjectURL(blob);

          console.log('Recording stopped, blob URL created:', this.currentRecording.recordingUrl);
          console.log('Recording chunks:', this.recordingChunks.length);
          console.log('Blob size:', blob.size);

          // Clean up
          this.cleanup();
          resolve(this.currentRecording);
        }
      };

      this.mediaRecorder!.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder!.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.currentRecording) {
      this.mediaRecorder.pause();
      this.currentRecording.status = 'paused';
      
      // Update recording indicator
      if (this.recordingIndicator) {
        this.recordingIndicator.innerHTML = `
          <div style="position: absolute; top: 5px; right: 5px; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace;">
            PAU
          </div>
        `;
        this.recordingIndicator.style.border = '2px solid #f59e0b';
        this.recordingIndicator.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
      }
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.currentRecording) {
      this.mediaRecorder.resume();
      this.currentRecording.status = 'recording';
      
      // Update recording indicator
      if (this.recordingIndicator) {
        this.recordingIndicator.innerHTML = `
          <div style="position: absolute; top: 5px; right: 5px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace;">
            REC
          </div>
        `;
        this.recordingIndicator.style.border = '2px solid #10b981';
        this.recordingIndicator.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      }
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): RecordingStatus {
    return this.currentRecording?.status || 'idle';
  }

  /**
   * Get current recording data
   */
  getCurrentRecording(): ScreenRecordingData | null {
    return this.currentRecording;
  }

  /**
   * Setup recording event handlers
   */
  private setupRecordingHandlers(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordingChunks.push(event.data);
        console.log('Recording chunk added, size:', event.data.size);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('Media recorder error:', event);
      if (this.currentRecording) {
        this.currentRecording.status = 'error';
      }
    };

    this.mediaRecorder.onstop = () => {
      console.log('Screen recording stopped, total chunks:', this.recordingChunks.length);
    };
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.recordingChunks = [];
    
    // Remove recording indicator
    this.removeRecordingIndicator();
  }

  /**
   * Remove recording indicator safely
   */
  private removeRecordingIndicator(): void {
    if (this.recordingIndicator) {
      try {
        if (document.body.contains(this.recordingIndicator)) {
          document.body.removeChild(this.recordingIndicator);
        }
      } catch (error) {
        console.warn('Error removing recording indicator:', error);
      }
      this.recordingIndicator = null;
    }
  }

  /**
   * Force remove recording indicator (public method for cleanup)
   */
  forceRemoveIndicator(): void {
    this.removeRecordingIndicator();
  }

  /**
   * Check if screen recording is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  /**
   * Get available recording formats
   */
  static getSupportedFormats(): string[] {
    const formats = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  }
} 