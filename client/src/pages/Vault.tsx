import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaylistCard from "@/components/PlaylistCard";
import TrackItem from "@/components/TrackItem";
import { Playlist, Track, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VaultPageProps {
  onPlayTrack: (track: Track) => void;
  darkMode?: boolean;
}

export default function VaultPage({ onPlayTrack, darkMode = false }: VaultPageProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    playlists: Playlist[];
    tracks: Track[];
  }>({ playlists: [], tracks: [] });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistColor, setNewPlaylistColor] = useState("#1DB954");
  const [newPlaylistIcon, setNewPlaylistIcon] = useState("ri-music-fill");
  
  const { toast } = useToast();

  // Fetch playlists
  const { data: playlists = [], isLoading: isLoadingPlaylists, refetch: refetchPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch playlist details and tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist) {
      fetch(`/api/playlists/${selectedPlaylist.id}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch playlist details');
          return res.json();
        })
        .then(data => {
          setPlaylistTracks(data.tracks || []);
        })
        .catch(err => {
          console.error('Error fetching playlist details:', err);
          toast({
            title: "Error",
            description: "Failed to load playlist tracks",
            variant: "destructive"
          });
        });
    }
  }, [selectedPlaylist, toast]);

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setCurrentPlayingTrack(null);
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentPlayingTrack(track);
    onPlayTrack(track);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/playlists', {
        name: newPlaylistName,
        color: newPlaylistColor,
        icon: newPlaylistIcon
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      // Clear the form
      setShowCreatePlaylist(false);
      setNewPlaylistName("");
      
      // First invalidate the queries
      await queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      
      // Then explicitly refetch to ensure UI updates
      await refetchPlaylists();
      
      toast({
        title: "Success",
        description: "Playlist created successfully",
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive"
      });
    }
  };

  const iconOptions = [
    { value: "ri-music-fill", label: "Music" },
    { value: "ri-mic-fill", label: "Microphone" },
    { value: "ri-album-fill", label: "Album" },
    { value: "ri-file-music-fill", label: "Music File" },
    { value: "ri-sound-module-fill", label: "Sound Module" },
    { value: "ri-vidicon-fill", label: "Video" },
  ];

  const colorOptions = [
    { value: "#1DB954", label: "Green" },
    { value: "#2D46B9", label: "Blue" },
    { value: "#F230AA", label: "Pink" },
    { value: "#FFC107", label: "Yellow" },
    { value: "#FF5722", label: "Orange" },
    { value: "#9C27B0", label: "Purple" },
  ];

  // All tracks state for search
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Fetch all tracks for search when dialog opens
  useEffect(() => {
    if (showSearchDialog && allTracks.length === 0) {
      setIsLoadingTracks(true);
      fetch('/api/tracks', {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch tracks');
          return res.json();
        })
        .then(data => {
          setAllTracks(data);
          setIsLoadingTracks(false);
        })
        .catch(err => {
          console.error('Error fetching tracks:', err);
          setIsLoadingTracks(false);
          toast({
            title: "Error",
            description: "Failed to load tracks for search",
            variant: "destructive"
          });
        });
    }
  }, [showSearchDialog, toast]);

  // Live search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ playlists: [], tracks: [] });
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter playlists by name
    const filteredPlaylists = playlists.filter(playlist => 
      playlist.name.toLowerCase().includes(query)
    );
    
    // Filter tracks by name
    const filteredTracks = allTracks.filter(track => 
      track.name.toLowerCase().includes(query)
    );
    
    setSearchResults({
      playlists: filteredPlaylists,
      tracks: filteredTracks
    });
  }, [searchQuery, playlists, allTracks]);
  
  // Helper to count tracks per playlist
  const getPlaylistTrackCount = (playlistId: number) => {
    // In a real app, you would fetch this from the API or have it in the playlist object
    return Math.floor(Math.random() * 15) + 1; // Mock data for now
  };

  if (isLoadingPlaylists || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} sticky top-0 z-10 shadow-md opacity-100`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-semibold lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>the vault</h1>
          <div className="flex space-x-3">
            <button 
              className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} p-2 rounded-full`}
              onClick={() => setShowSearchDialog(true)}
            >
              <i className="ri-search-line text-xl"></i>
            </button>
            <button 
              className={`${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} p-2 rounded-full`}
              onClick={() => setShowCreatePlaylist(true)}
            >
              <i className="ri-add-line text-xl"></i>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content - Playlists */}
      {!selectedPlaylist ? (
        <div className="container mx-auto px-4 py-6">
          <h2 className={`text-xl font-medium mb-4 lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>playlists</h2>
          
          {playlists.length === 0 ? (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-md p-6 mb-4 text-center`}>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 lowercase`}>you don't have any playlists yet.</p>
              <Button
                onClick={() => setShowCreatePlaylist(true)}
                className="bg-primary hover:bg-primary/80 lowercase"
              >
                <i className="ri-add-line mr-2"></i>
                create your first playlist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id}
                  playlist={playlist}
                  trackCount={playlistTracks.filter(track => track.categoryId === playlist.id).length}
                  onClick={() => handlePlaylistSelect(playlist)}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Playlist Detail View
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center mb-6">
            <button 
              className={`mr-4 p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded-full`}
              onClick={handleBackToPlaylists}
            >
              <i className={`ri-arrow-left-line text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}></i>
            </button>
            <h2 className={`text-2xl font-semibold lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPlaylist.name.toLowerCase()}</h2>
          </div>
          
          <div 
            className="bg-gradient-to-b p-6 rounded-lg mb-6"
            style={{ backgroundImage: `linear-gradient(to bottom, ${selectedPlaylist.color}30, transparent)` }}
          >
            <div className="flex items-center">
              <div 
                className="w-24 h-24 rounded-md flex items-center justify-center mr-6 flex-shrink-0"
                style={{ backgroundColor: selectedPlaylist.color }}
              >
                <i className={`${selectedPlaylist.icon} text-4xl text-white`}></i>
              </div>
              <div>
                <h2 className={`text-2xl font-bold lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPlaylist.name.toLowerCase()}</h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} lowercase`}>{playlistTracks.length} recordings · created by you</p>
                <div className="flex mt-4 space-x-2">
                  <button 
                    className="bg-primary text-white py-2 px-6 rounded-full font-medium hover:bg-opacity-80 lowercase"
                    onClick={() => {
                      if (playlistTracks.length > 0) {
                        handlePlayTrack(playlistTracks[0]);
                      }
                    }}
                    disabled={playlistTracks.length === 0}
                  >
                    <i className="ri-play-fill mr-1"></i> play all
                  </button>
                  <button className={`${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} py-2 px-4 rounded-full font-medium lowercase`}>
                    <i className="ri-add-line mr-1"></i> add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {playlistTracks.length === 0 ? (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-6 rounded-md text-center`}>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} lowercase`}>this playlist is empty. add tracks to get started.</p>
              </div>
            ) : (
              playlistTracks.map((track, index) => (
                <TrackItem 
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={currentPlayingTrack?.id === track.id}
                  onPlay={() => handlePlayTrack(track)}
                  darkMode={darkMode}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={`${darkMode ? 'text-white' : 'text-gray-900'} lowercase`}>create new playlist</DialogTitle>
            <DialogDescription className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} lowercase`}>create a new playlist to organize your recordings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mb-4">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 lowercase`}>playlist name</label>
              <Input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="enter playlist name"
                className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 lowercase`}>icon</label>
              <Select
                value={newPlaylistIcon}
                onValueChange={setNewPlaylistIcon}
              >
                <SelectTrigger className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <SelectValue placeholder="select an icon" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon.value} value={icon.value} className="lowercase">
                      <div className="flex items-center">
                        <i className={`${icon.value} mr-2`}></i>
                        <span>{icon.label.toLowerCase()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 lowercase`}>color</label>
              <Select
                value={newPlaylistColor}
                onValueChange={setNewPlaylistColor}
              >
                <SelectTrigger className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <SelectValue placeholder="select a color" />
                </SelectTrigger>
                <SelectContent className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value} className="lowercase">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.value }}
                        ></div>
                        <span>{color.label.toLowerCase()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreatePlaylist(false)}
              className={`${darkMode ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-700'} lowercase`}
            >
              cancel
            </Button>
            <Button 
              onClick={handleCreatePlaylist}
              className="bg-primary hover:bg-primary/80 lowercase"
            >
              create playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={`${darkMode ? 'text-white' : 'text-gray-900'} lowercase`}>search</DialogTitle>
            <DialogDescription className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} lowercase`}>search for playlists and recordings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search for playlists and recordings..."
                className={`w-full ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
              <Button 
                className="bg-primary hover:bg-primary/80 lowercase"
              >
                search
              </Button>
            </div>
            
            {searchQuery.trim() && (
              <div className="mt-4">
                {searchResults.playlists.length === 0 && searchResults.tracks.length === 0 ? (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4 lowercase`}>no results found</p>
                ) : (
                  <>
                    {searchResults.playlists.length > 0 && (
                      <div className="mb-6">
                        <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium mb-2 lowercase`}>playlists</h3>
                        <div className="space-y-2">
                          {searchResults.playlists.map(playlist => (
                            <div 
                              key={playlist.id}
                              className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-md flex items-center cursor-pointer`}
                              onClick={() => {
                                handlePlaylistSelect(playlist);
                                setShowSearchDialog(false);
                              }}
                            >
                              <div 
                                className="w-10 h-10 rounded-md flex items-center justify-center mr-3"
                                style={{ backgroundColor: playlist.color }}
                              >
                                <i className={`${playlist.icon} text-white`}></i>
                              </div>
                              <div>
                                <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium lowercase`}>{playlist.name.toLowerCase()}</h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} lowercase`}>{playlistTracks.filter(track => track.categoryId === playlist.id).length} recordings</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchResults.tracks.length > 0 && (
                      <div>
                        <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium mb-2 lowercase`}>recordings</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {searchResults.tracks.map((track, index) => (
                            <div 
                              key={track.id}
                              className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-md flex items-center cursor-pointer`}
                              onClick={() => {
                                handlePlayTrack(track);
                                setShowSearchDialog(false);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-md ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center mr-3`}>
                                <i className="ri-music-fill text-primary"></i>
                              </div>
                              <div className="flex-grow">
                                <h4 className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium lowercase`}>{track.name.toLowerCase()}</h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {typeof track.createdAt === 'string' 
                                    ? new Date(track.createdAt).toLocaleDateString() 
                                    : track.createdAt instanceof Date 
                                      ? track.createdAt.toLocaleDateString()
                                      : 'No date'}
                                </p>
                              </div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSearchDialog(false)}
              className={`${darkMode ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-700'} lowercase`}
            >
              close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
