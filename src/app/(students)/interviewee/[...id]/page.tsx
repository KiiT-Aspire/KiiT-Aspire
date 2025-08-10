"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactMediaRecorder } from "react-media-recorder";

const Interviewee = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("idle");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>("");
  const recorderRef = useRef<{
    startRecording?: () => void;
    stopRecording?: () => void;
    clearBlobUrl?: () => void;
    status?: string;
  }>({});
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const sendAudioToAPI = useCallback(
    async (audioUrl: string, duration: number) => {
      setIsProcessing(true);

      try {
        console.log("Fetching audio from URL:", audioUrl);

        // Fetch the blob from the URL
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();

        console.log("Audio blob:", {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: duration,
        });

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;

            if (!base64Audio) {
              console.error("Failed to read audio file");
              return;
            }

            // Remove the data URL prefix to get pure base64
            const base64Data = base64Audio.split(",")[1];

            if (!base64Data) {
              console.error("Failed to extract base64 data");
              return;
            }

            console.log("Base64 data length:", base64Data.length);

            const payload = {
              audio: base64Data,
              mimeType: audioBlob.type,
              duration: duration,
            };

            console.log("Sending payload:", {
              audioLength: payload.audio.length,
              mimeType: payload.mimeType,
              duration: payload.duration,
            });

            const apiResponse = await fetch("/api/audio-upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (apiResponse.ok) {
              const result = await apiResponse.json();
              console.log("Audio processed successfully:", result);
              alert("Audio sent successfully!");
            } else {
              const errorText = await apiResponse.text();
              console.error("Failed to process audio:", errorText);
              alert("Failed to send audio. Check console for details.");
            }
          } catch (error) {
            console.error("Error in reader.onloadend:", error);
            alert("Error processing audio file.");
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          console.error("FileReader error");
          setIsProcessing(false);
          alert("Error reading audio file.");
        };

        reader.readAsDataURL(audioBlob);
      } catch (error) {
        console.error("Error sending audio:", error);
        setIsProcessing(false);
        alert("Error sending audio. Check console for details.");
      }
    },
    []
  );

  // Handle spacebar recording (don't start timer here - wait for actual recording to start)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !isSpacePressed &&
        (currentStatus === "idle" || currentStatus === "stopped")
      ) {
        event.preventDefault();
        setIsSpacePressed(true);
        if (recorderRef.current.clearBlobUrl)
          recorderRef.current.clearBlobUrl();
        if (recorderRef.current.startRecording)
          recorderRef.current.startRecording();
        // Don't reset duration here - wait for recording to actually start
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isSpacePressed) {
        event.preventDefault();
        setIsSpacePressed(false);
        if (recorderRef.current.stopRecording)
          recorderRef.current.stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed, currentStatus]);

  // Handle duration timer based on recording status (start timer only when actually recording)
  useEffect(() => {
    if (currentStatus === "recording") {
      // Reset duration and start timer only when recording actually starts
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop duration timer when recording stops
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [currentStatus]);

  // Handle audio metadata loading when media URL changes
  useEffect(() => {
    if (currentMediaUrl && audioRef.current) {
      // Reset duration
      setAudioDuration(0);

      // Force load metadata
      audioRef.current.load();

      // Try multiple times to get duration
      const tryGetDuration = (attempts = 0) => {
        if (attempts > 10) return; // Give up after 10 attempts

        setTimeout(() => {
          if (
            audioRef.current &&
            audioRef.current.duration &&
            !isNaN(audioRef.current.duration)
          ) {
            setAudioDuration(audioRef.current.duration);
          } else {
            tryGetDuration(attempts + 1);
          }
        }, 50 * (attempts + 1)); // Increasing delay
      };

      tryGetDuration();
    }
  }, [currentMediaUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle audio metadata loading to get duration
  const handleAudioMetadataLoaded = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration || 0);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "idle":
        return "Hold SPACEBAR to record";
      case "acquiring_media":
        return "Getting microphone access...";
      case "recording":
        return "Recording...";
      case "stopped":
        return "Recording stopped";
      case "permission_denied":
        return "Microphone permission denied";
      default:
        return "Ready";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Interview Audio Recorder</h1>

      <ReactMediaRecorder
        audio={true}
        video={false}
        askPermissionOnMount={true}
        blobPropertyBag={{
          type: "audio/wav",
        }}
        mediaRecorderOptions={{
          audioBitsPerSecond: 128000,
        }}
        render={({
          status,
          startRecording,
          stopRecording,
          mediaBlobUrl,
          clearBlobUrl,
        }) => {
          // Update recorder ref and status when render prop values change
          recorderRef.current = {
            startRecording,
            stopRecording,
            clearBlobUrl,
            status,
          };

          // Update current status to trigger effects
          if (currentStatus !== status) {
            setCurrentStatus(status);
          }

          // Update media URL when it changes
          if (currentMediaUrl !== mediaBlobUrl) {
            setCurrentMediaUrl(mediaBlobUrl || "");
          }

          const handleSendAudio = async () => {
            if (!mediaBlobUrl) {
              console.error("No audio URL available");
              alert("No audio recording available to send.");
              return;
            }

            await sendAudioToAPI(mediaBlobUrl, recordingDuration);
          };

          const handleClearRecording = () => {
            if (clearBlobUrl) clearBlobUrl();
            setRecordingDuration(0);
          };

          return (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Audio Recording</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="mb-4">
                      <div
                        className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${
                          status === "recording"
                            ? "border-red-500 bg-red-50 animate-pulse"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-16 h-16 rounded-full ${
                            status === "recording"
                              ? "bg-red-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-lg font-semibold">
                        {getStatusMessage(status)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatTime(recordingDuration)}
                      </p>
                      <p className="text-xs text-gray-500">Status: {status}</p>
                    </div>

                    {isProcessing && (
                      <p className="text-blue-600">
                        Sending audio to server...
                      </p>
                    )}
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    <p>• Hold SPACEBAR to start recording</p>
                    <p>• Release SPACEBAR to stop recording</p>
                    <p>• Click Send Audio button to send to server</p>
                  </div>

                  {mediaBlobUrl && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Current Recording:
                      </h3>
                      {audioDuration > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          Audio Duration:{" "}
                          {formatTime(Math.floor(audioDuration))}
                        </p>
                      )}
                      <audio
                        ref={audioRef}
                        controls
                        preload="metadata"
                        className="w-full mb-4"
                        onLoadedMetadata={handleAudioMetadataLoaded}
                        onCanPlay={() => {
                          // Try to get duration when audio can play
                          if (
                            audioRef.current &&
                            audioRef.current.duration &&
                            !isNaN(audioRef.current.duration)
                          ) {
                            setAudioDuration(audioRef.current.duration);
                          }
                        }}
                        onLoadedData={() => {
                          // Another event that fires when data is loaded
                          if (
                            audioRef.current &&
                            audioRef.current.duration &&
                            !isNaN(audioRef.current.duration)
                          ) {
                            setAudioDuration(audioRef.current.duration);
                          }
                        }}
                      >
                        <source src={mediaBlobUrl} type="audio/webm" />
                        <source src={mediaBlobUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>

                      <div className="text-center space-x-4">
                        <Button
                          onClick={handleSendAudio}
                          disabled={isProcessing || !mediaBlobUrl}
                          className="px-6 py-2"
                        >
                          {isProcessing ? "Sending..." : "Send Audio"}
                        </Button>

                        <Button
                          onClick={handleClearRecording}
                          disabled={isProcessing}
                          variant="outline"
                          className="px-6 py-2"
                        >
                          Clear Recording
                        </Button>
                      </div>

                      {/* Debug Information */}
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <p>
                          <strong>Debug Info:</strong>
                        </p>
                        <p>Recording Status: {status}</p>
                        <p>Duration: {recordingDuration}s</p>
                        <p>
                          Audio URL:{" "}
                          {mediaBlobUrl ? "Available" : "Not available"}
                        </p>
                        <p>Space Pressed: {isSpacePressed ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      1. Make sure your microphone is connected and permissions
                      are granted
                    </p>
                    <p>2. Hold down the SPACEBAR to start recording</p>
                    <p>3. Speak clearly into your microphone</p>
                    <p>4. Release the SPACEBAR to stop recording</p>
                    <p>
                      5. Click the &quot;Send Audio&quot; button to send to the
                      server
                    </p>
                    <p>
                      6. Audio will be recorded in WebM format with Opus codec
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        }}
      />
    </div>
  );
};

export default Interviewee;
