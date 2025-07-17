# Screen Recording & User Action Logging Features

## Overview

This implementation provides comprehensive user interaction tracking and screen recording capabilities with a clean, modular architecture. The system captures both user actions and screen recordings to provide detailed analytics about user behavior.

## Architecture

### Core Services

1. **ScreenRecordingService** (`src/lib/screenRecording.ts`)
   - Handles screen capture and video recording
   - Supports pause/resume functionality
   - Configurable quality and format settings
   - Automatic cleanup and resource management

2. **UserActionLogger** (`src/lib/userActionLogger.ts`)
   - Tracks all user interactions automatically
   - Captures clicks, scrolls, mouse movements, keyboard events
   - Maintains session context and timestamps
   - Provides detailed action data with coordinates

3. **AnalyticsService** (`src/lib/analyticsService.ts`)
   - Coordinates screen recording and action logging
   - Manages session data and analytics
   - Provides unified interface for data access
   - Handles session lifecycle management

### Components

1. **RecordingControls** (`src/components/RecordingControls.tsx`)
   - User interface for controlling recording
   - Real-time status display
   - Session statistics
   - Export functionality

2. **SessionDataViewer** (`src/components/SessionDataViewer.tsx`)
   - Comprehensive data visualization
   - Filterable action logs
   - Screen recording playback
   - Statistical analysis

3. **Enhanced EmbedCanvas** (`src/components/EmbedCanvas.tsx`)
   - Integrated analytics tracking
   - Automatic URL context updates
   - Enhanced interaction logging

## Features

### Screen Recording
- **Automatic Detection**: Checks browser support for screen recording
- **Quality Control**: Configurable resolution and frame rate
- **Privacy Focused**: No audio recording by default
- **Format Support**: WebM with VP9 codec for optimal quality
- **Resource Management**: Automatic cleanup and memory management

### User Action Logging
- **Comprehensive Tracking**: Clicks, scrolls, mouse movements, keyboard events
- **Context Preservation**: URL tracking and session management
- **Coordinate Capture**: Precise mouse position tracking
- **Element Identification**: Target element information
- **Throttled Events**: Performance-optimized mouse movement tracking

### Data Management
- **Session-Based**: All data tied to unique session IDs
- **Real-Time Updates**: Live analytics updates during recording
- **Export Capability**: JSON export of complete session data
- **Filtering**: Action type filtering and search
- **Statistics**: Detailed breakdown of user interactions

## Usage

### Starting Recording
1. Click the "● Record" button in the recording controls
2. Grant screen recording permissions when prompted
3. Recording automatically starts capturing both screen and user actions

### During Recording
- **Pause/Resume**: Use the pause button to temporarily stop recording
- **Real-Time Stats**: View live session statistics
- **Status Indicator**: Green dot indicates active recording

### After Recording
1. Click "■ Stop" to end recording
2. Session data viewer automatically opens
3. Review captured actions, screen recording, and statistics
4. Export data as JSON for further analysis

## Data Structure

### User Actions
```typescript
interface UserAction {
  id: string;
  type: UserActionType;
  timestamp: number;
  url: string;
  coordinates?: { x: number; y: number };
  element?: string;
  data?: any;
  sessionId: string;
}
```

### Screen Recording
```typescript
interface ScreenRecordingData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  recordingUrl?: string;
  status: RecordingStatus;
  metadata: RecordingMetadata;
}
```

### Session Data
```typescript
interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  userActions: UserAction[];
  screenRecording?: ScreenRecordingData;
  analytics: AnalyticsData;
}
```

## Browser Support

### Screen Recording
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Limited support (may require user interaction)
- **Edge**: Full support

### User Action Logging
- **All Modern Browsers**: Full support
- **Event Capture**: Comprehensive event listener management
- **Performance**: Optimized for minimal impact

## Privacy & Security

### Data Handling
- **Local Storage**: All data stored locally in browser
- **No External Transmission**: No data sent to external servers
- **User Control**: Users can export and delete their data
- **Session Isolation**: Each session is completely independent

### Recording Permissions
- **Explicit Consent**: Users must grant screen recording permission
- **Visual Indicators**: Clear status indicators during recording
- **Easy Stopping**: One-click stop functionality
- **No Audio**: Audio recording disabled by default

## Performance Considerations

### Optimization
- **Throttled Events**: Mouse movement events throttled to 100ms
- **Memory Management**: Automatic cleanup of recording resources
- **Efficient Storage**: Optimized data structures for large datasets
- **Lazy Loading**: Components load data on demand

### Scalability
- **Session Limits**: Configurable session duration limits
- **Data Limits**: Automatic cleanup of old action data
- **Resource Monitoring**: Memory and CPU usage tracking
- **Graceful Degradation**: Fallback when features unavailable

## Development

### Adding New Action Types
1. Update `UserActionType` in `src/types/analytics.ts`
2. Add event listener in `UserActionLogger`
3. Implement handler method
4. Update UI components as needed

### Customizing Recording Quality
```typescript
// In ScreenRecordingService
const options: MediaRecorderOptions = {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000 // Adjust quality
};
```

### Extending Analytics
```typescript
// Add new analytics fields
interface AnalyticsData {
  // ... existing fields
  customMetric?: number;
}
```

## Troubleshooting

### Common Issues

1. **Screen Recording Permission Denied**
   - Ensure HTTPS environment
   - Check browser permissions
   - Verify user interaction before recording

2. **Recording Not Starting**
   - Check browser support
   - Verify MediaRecorder API availability
   - Check console for errors

3. **Performance Issues**
   - Reduce recording quality
   - Increase event throttling
   - Monitor memory usage

### Debug Mode
Enable detailed logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Future Enhancements

### Planned Features
- **Heatmap Visualization**: Visual representation of user interactions
- **Session Replay**: Full session playback with user actions
- **Advanced Analytics**: Machine learning insights
- **Cloud Storage**: Optional cloud backup of session data
- **Collaborative Features**: Share session data with team members

### API Extensions
- **Webhook Support**: Real-time data transmission
- **Custom Events**: User-defined action types
- **Integration APIs**: Third-party analytics integration
- **Export Formats**: Additional export formats (CSV, XML)

## Contributing

When adding new features:
1. Follow the existing architecture patterns
2. Add comprehensive TypeScript types
3. Include error handling and fallbacks
4. Update documentation
5. Add tests for new functionality

## License

This implementation is part of the Iter8 project and follows the project's licensing terms. 