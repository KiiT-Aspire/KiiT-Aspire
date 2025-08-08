'use client';

import { useState, useRef, useEffect } from 'react';

// Speech Recognition interfaces
interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: unknown;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
}

// Extend the Window interface
declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): ISpeechRecognition;
    };
    SpeechRecognition: {
      new (): ISpeechRecognition;
    };
  }
}

const Interviewee = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [useOfflineRecognition, setUseOfflineRecognition] = useState<boolean>(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permission.state);
        return permission.state === 'granted';
      }
      return true; // Assume granted if we can't check
    } catch (err) {
      console.error('Error checking microphone permission:', err);
      return true; // Assume granted if we can't check
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setPermissionStatus('granted');
      setError('');
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setPermissionStatus('denied');
      setError('Microphone access denied. Please allow microphone permissions in your browser settings.');
      return false;
    }
  };

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Speech recognition requires HTTPS or localhost');
      setIsSupported(false);
      return;
    }

    try {
      // Initialize Speech Recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Configure recognition based on user preference
      if (useOfflineRecognition) {
        // Try to use local/offline recognition when possible
        // This forces the browser to use local speech recognition instead of cloud services
        if ('serviceURI' in recognition) {
          recognition.serviceURI = '';  // Empty URI forces local recognition
        }
        // Set maxAlternatives to 1 for better performance with local recognition
        recognition.maxAlternatives = 1;
      } else {
        // Use default cloud-based recognition
        recognition.maxAlternatives = 5;
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript);
        setError(''); // Clear any previous errors on successful recognition
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Handle different error types
        switch (event.error) {
          case 'network':
            if (useOfflineRecognition) {
              setError('Network error in offline mode. Please ensure Windows Speech Recognition is properly set up in your system settings (Settings → Accessibility → Speech).');
            } else {
              setError('Network error. Please check your internet connection and try again, or switch to offline mode.');
            }
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone permissions and try again.');
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('Audio capture failed. Please check your microphone.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not allowed. Please check your browser settings or enable Windows Speech Recognition.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onstart = () => {
        setError(''); // Clear errors when starting
      };

    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setError('Failed to initialize speech recognition');
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
      }
    };
  }, [useOfflineRecognition]);

  const startListening = async () => {
    if (!recognitionRef.current || isListening) return;

    // Check microphone permission first
    if (permissionStatus === 'denied') {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
    }

    try {
      setTranscript('');
      setError('');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        setIsListening(false);
        recognitionRef.current.stop();
        setError('');
      } catch (err) {
        console.error('Error stopping recognition:', err);
        setIsListening(false);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError('');
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Speech Recognition Unavailable</h2>
          <p className="text-gray-600 mb-4">
            {error || "Your browser doesn't support the Web Speech API or it's not available in a secure context."}
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
            <p className="font-medium mb-2">Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Chrome, Edge, or Safari browser</li>
              <li>HTTPS connection (or localhost)</li>
              <li>Microphone permissions</li>
              <li>Windows Speech Recognition enabled (recommended for offline use)</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="font-medium text-blue-800 mb-1">To enable Windows Speech Recognition:</p>
              <ol className="list-decimal list-inside text-blue-700 text-xs space-y-1">
                <li>Go to Settings → Accessibility → Speech</li>
                <li>Turn on &quot;Windows Speech Recognition&quot;</li>
                <li>Complete the speech recognition setup</li>
                <li>This allows offline speech recognition without internet</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Speech to Text Converter</h1>
                <p className="text-blue-100">Click the microphone to start recording your voice</p>
              </div>
              
              {/* Recognition Mode Toggle */}
              <div className="bg-white/10 rounded-lg p-3">
                <label className="flex items-center gap-2 text-white text-sm">
                  <span>Offline Mode:</span>
                  <button
                    onClick={() => setUseOfflineRecognition(!useOfflineRecognition)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useOfflineRecognition ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useOfflineRecognition ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <p className="text-blue-200 text-xs mt-1">
                  {useOfflineRecognition ? 'Uses Windows Speech Recognition' : 'Uses cloud-based recognition'}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 font-medium">Error:</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              {!isListening ? (
                <button
                  onClick={startListening}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md animate-pulse"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop Recording
                </button>
              )}
              
              <button
                onClick={clearTranscript}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md"
                disabled={!transcript && !error}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L8.586 12l-2.293 2.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L10.414 12l2.293-2.293z" clipRule="evenodd" />
                </svg>
                {error ? 'Clear Error' : 'Clear Text'}
              </button>
              
              {error && (
                <button
                  onClick={startListening}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Retry
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-center gap-6">
              {/* Listening Status */}
              <div className="flex items-center gap-2">
                {isListening ? (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 font-medium">Listening...</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">Not listening</span>
                  </>
                )}
              </div>
              
              {/* Permission Status */}
              <div className="flex items-center gap-2">
                {permissionStatus === 'granted' ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 text-sm">Microphone allowed</span>
                  </>
                ) : permissionStatus === 'denied' ? (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 text-sm">Microphone denied</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-600 text-sm">Permission unknown</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Display */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transcript:</h2>
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-4">
              {transcript ? (
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              ) : (
                <p className="text-gray-500 italic text-center py-8">
                  Your speech will appear here...
                </p>
              )}
            </div>
            
            {transcript && (
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">Word count:</span> {transcript.trim().split(/\s+/).length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviewee;
