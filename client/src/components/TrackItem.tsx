import { formatDate, formatDuration } from "@/lib/utils";
import { Track } from "@shared/schema";

interface TrackItemProps {
  track: Track;
  index: number;
  isPlaying?: boolean;
  onPlay: () => void;
  darkMode?: boolean;
}

export default function TrackItem({ track, index, isPlaying = false, onPlay, darkMode = false }: TrackItemProps) {
  const createdAt = track.createdAt ? new Date(track.createdAt) : new Date();
  
  return (
    <div 
      className={`${isPlaying 
        ? 'bg-primary/10 hover:bg-primary/20 border border-primary/30' 
        : darkMode 
          ? 'bg-gray-800 hover:bg-gray-700' 
          : 'bg-white hover:bg-gray-50'} 
        p-3 rounded-md flex items-center cursor-pointer`} 
      onClick={onPlay}
    >
      <div className={`mr-3 ${isPlaying 
        ? 'text-primary' 
        : darkMode 
          ? 'text-gray-400' 
          : 'text-gray-500'} w-8 text-center`}>
        {isPlaying ? (
          <i className="ri-play-fill text-lg"></i>
        ) : (
          index + 1
        )}
      </div>
      <div className="flex-grow">
        <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium lowercase`}>{track.name.toLowerCase()}</h4>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {formatDate(createdAt)} · {formatDuration(track.duration)}
        </p>
      </div>
      <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
        <i className="ri-more-2-fill"></i>
      </button>
    </div>
  );
}
