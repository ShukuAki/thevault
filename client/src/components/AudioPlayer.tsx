import { useState, useEffect, useRef } from "react";
import { Track } from "@shared/schema";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  darkMode?: boolean;
}

export default function AudioPlayer({ track, isPlaying, onPlayPause, onClose, darkMode = false }: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error("Failed to play:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect for when track changes
  useEffect(() => {
    if (audioRef.current) {
      setCurrentTime(0);
      setProgress(0);
      audioRef.current.currentTime = 0;
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error("Failed to play:", err));
      }
    }
  }, [track.id]);

  const handleSkipBack = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration, 
        audioRef.current.currentTime + 10
      );
    }
  };

  return (
    <div className={`fixed bottom-16 left-0 right-0 ${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'} p-3 z-20 transition-transform duration-300 shadow-lg`}>
      <audio 
        ref={audioRef} 
        src={`/api/tracks/${track.id}/audio`} 
        onEnded={() => onPlayPause()} 
        className="hidden"
      />
      
      <div className="flex items-center">
        <div className="mr-3">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center">
            <i className="ri-mic-fill text-white"></i>
          </div>
        </div>
        <div className="flex-grow mr-4">
          <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-sm font-medium lowercase`}>{track.name.toLowerCase()}</h4>
          <div className={`h-1 w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden mt-2`}>
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={`flex justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className={`${darkMode ? 'text-white' : 'text-gray-900'} p-1`}
            onClick={handleSkipBack}
          >
            <i className="ri-skip-back-fill text-lg"></i>
          </button>
          <button 
            className="text-white bg-primary w-8 h-8 rounded-full flex items-center justify-center"
            onClick={onPlayPause}
          >
            <i className={`${isPlaying ? 'ri-pause-fill' : 'ri-play-fill'} text-lg`}></i>
          </button>
          <button 
            className={`${darkMode ? 'text-white' : 'text-gray-900'} p-1`}
            onClick={handleSkipForward}
          >
            <i className="ri-skip-forward-fill text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
