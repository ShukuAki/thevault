import { Playlist } from "@shared/schema";

interface PlaylistCardProps {
  playlist: Playlist;
  trackCount: number;
  onClick: () => void;
  darkMode?: boolean;
}

export default function PlaylistCard({ playlist, trackCount, onClick, darkMode = false }: PlaylistCardProps) {
  return (
    <div 
      className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-md p-4 mb-4 shadow-md transition duration-200 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div 
          className="w-16 h-16 rounded-md flex items-center justify-center mr-4 flex-shrink-0"
          style={{ backgroundColor: playlist.color }}
        >
          <i className={`${playlist.icon} text-2xl text-white`}></i>
        </div>
        <div className="flex-grow">
          <h3 className={`font-medium lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlist.name.toLowerCase()}</h3>
          <p className={`text-sm lowercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{trackCount} recordings</p>
        </div>
        <button className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-200'} p-2 rounded-full`}>
          <i className="ri-more-2-fill"></i>
        </button>
      </div>
    </div>
  );
}
