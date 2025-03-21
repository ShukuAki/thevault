import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDuration } from "@/lib/utils";
import { Playlist } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecorderProps {
  categoryId: number;
  categoryName: string;
  onSaveComplete: () => void;
  onCancel: () => void;
  playlists: Playlist[];
}

export default function Recorder({ categoryId, categoryName, onSaveComplete, onCancel, playlists }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(15).fill(10));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const animationIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Initialize and cleanup MediaRecorder
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordingBlob(audioBlob);
        
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks on the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start waveform animation
      animateWaveform();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Resume animation
      animateWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      
      setShowSaveOptions(true);
    }
  };

  const animateWaveform = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    
    animationIntervalRef.current = window.setInterval(() => {
      setWaveformHeights(prevHeights => 
        prevHeights.map(() => Math.floor(Math.random() * 35) + 5)
      );
    }, 150);
  };

  const handleSaveRecording = async () => {
    if (!recordingBlob || !recordingName) {
      toast({
        title: "Error",
        description: "Please provide a name for your recording",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('audio', recordingBlob, `${recordingName}.wav`);
      formData.append('name', recordingName);
      formData.append('categoryId', categoryId.toString());
      formData.append('duration', recordingTime.toString());
      
      // Upload the track
      const response = await fetch('/api/tracks/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
      
      const track = await response.json();
      
      // If a playlist was selected, add the track to it
      if (selectedPlaylistId) {
        await apiRequest('POST', `/api/playlists/${selectedPlaylistId}/tracks`, { 
          trackId: track.id 
        });
      }
      
      toast({
        title: "Success",
        description: "Recording saved successfully",
      });
      
      onSaveComplete();
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          className="mr-4 p-2 hover:bg-gray-800 rounded-full" 
          onClick={onCancel}
        >
          <i className="ri-arrow-left-line text-xl text-white"></i>
        </Button>
        <h2 className="text-xl font-medium">Record Audio</h2>
      </div>
      
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="text-center mb-6">
          <div className="text-lg font-medium text-white">Recording</div>
          <div className="text-lightgray text-sm">Category: {categoryName}</div>
        </div>
        
        {/* Recording visualization */}
        <div className="flex items-center justify-center h-16 mb-8 space-x-1">
          {waveformHeights.map((height, index) => (
            <div 
              key={index}
              className="waveform-bar bg-primary w-1 rounded-md"
              style={{ 
                height: `${height}px`,
                opacity: isRecording && !isPaused ? 1 : 0.5
              }}
            ></div>
          ))}
        </div>
        
        <div className="flex items-center justify-center mb-4">
          <div className="text-white text-lg font-medium">
            {formatDuration(recordingTime)}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          {(!isRecording && !showSaveOptions) && (
            <Button
              variant="outline"
              size="icon"
              onClick={onCancel}
              className="bg-gray-800 p-4 rounded-full hover:bg-gray-700 transition"
            >
              <i className="ri-delete-bin-line text-white text-xl"></i>
            </Button>
          )}
          
          {!showSaveOptions && (
            <>
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  className="bg-primary p-5 rounded-full hover:bg-primary/80 transition"
                >
                  <i className="ri-mic-fill text-white text-2xl"></i>
                </Button>
              ) : (
                <>
                  {isPaused ? (
                    <Button 
                      onClick={resumeRecording}
                      className="bg-primary p-5 rounded-full hover:bg-primary/80 transition"
                    >
                      <i className="ri-play-fill text-white text-2xl"></i>
                    </Button>
                  ) : (
                    <Button 
                      onClick={pauseRecording}
                      className="bg-primary p-5 rounded-full hover:bg-primary/80 transition"
                    >
                      <i className="ri-pause-fill text-white text-2xl"></i>
                    </Button>
                  )}
                </>
              )}
              
              {isRecording && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={stopRecording}
                  className="bg-gray-800 p-4 rounded-full hover:bg-gray-700 transition"
                >
                  <i className="ri-stop-fill text-white text-xl"></i>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Saving options */}
      {showSaveOptions && (
        <div className="mt-6">
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <div className="mb-4">
              <label htmlFor="recording-name" className="block text-sm font-medium text-lightgray mb-1">
                Recording Name
              </label>
              <Input
                type="text" 
                id="recording-name" 
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder="Enter a name for your recording"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="playlist-select" className="block text-sm font-medium text-lightgray mb-1">
                Add to Playlist (Optional)
              </label>
              <Select
                value={selectedPlaylistId}
                onValueChange={setSelectedPlaylistId}
              >
                <SelectTrigger className="w-full bg-gray-800 border border-gray-700 text-white">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id.toString()}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSaveOptions(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/80"
                onClick={handleSaveRecording}
              >
                Save Recording
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
