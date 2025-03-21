import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Playlist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import Recorder from "@/components/Recorder";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UploadPageProps {
  darkMode?: boolean;
}

export default function UploadPage({ darkMode = false }: UploadPageProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistIcon, setNewPlaylistIcon] = useState("ri-music-fill");
  const [newPlaylistColor, setNewPlaylistColor] = useState("#1DB954");
  
  const { toast } = useToast();
  
  // Fetch playlists
  const { data: playlists = [], isLoading: isLoadingPlaylists, refetch: refetchPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowUploadOptions(true);
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setShowUploadOptions(false);
  };

  const handleShowRecorder = () => {
    setShowRecorder(true);
    setShowUploadOptions(false);
  };

  const handleRecorderBack = () => {
    setShowRecorder(false);
    setShowUploadOptions(true);
  };

  const handleRecorderComplete = () => {
    setShowRecorder(false);
    setShowUploadOptions(false);
    setSelectedPlaylist(null);
    toast({
      title: "Success",
      description: "Your recording has been saved successfully",
    });
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

      // Clear out the form
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
    { value: "ri-mic-fill", label: "Microphone" },
    { value: "ri-file-music-fill", label: "Music File" },
    { value: "ri-sound-module-fill", label: "Sound Module" },
    { value: "ri-vidicon-fill", label: "Video" },
    { value: "ri-folder-music-fill", label: "Music Folder" },
    { value: "ri-music-fill", label: "Music" },
  ];

  const colorOptions = [
    { value: "#1DB954", label: "Green" },
    { value: "#2D46B9", label: "Blue" },
    { value: "#F230AA", label: "Pink" },
    { value: "#FFC107", label: "Yellow" },
    { value: "#FF5722", label: "Orange" },
    { value: "#9C27B0", label: "Purple" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPlaylist) return;
    
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }
    
    // Create a form with the file and metadata
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    formData.append('duration', '0'); // We'll update this after the upload
    
    // Upload the file
    fetch('/api/tracks/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      })
      .then((track) => {
        // Add the track to the playlist
        fetch(`/api/playlists/${selectedPlaylist.id}/tracks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trackId: track.id,
            position: 9999 // Add to the end
          }),
          credentials: 'include'
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to add track to playlist');
          
          toast({
            title: "Success",
            description: "Your audio file has been uploaded and added to the playlist",
          });
          setShowUploadOptions(false);
          setSelectedPlaylist(null);
        })
        .catch(error => {
          console.error('Error adding to playlist:', error);
          toast({
            title: "Warning",
            description: "File uploaded but couldn't add to playlist",
            variant: "destructive"
          });
        });
      })
      .catch(error => {
        console.error('Upload error:', error);
        toast({
          title: "Error",
          description: "Failed to upload audio file",
          variant: "destructive"
        });
      });
  };

  if (isLoadingPlaylists) {
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
          <h1 className={`text-2xl font-semibold lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>upload</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-6">
        {/* Playlist Selection */}
        {!showUploadOptions && !showRecorder && (
          <>
            <h2 className={`text-xl font-medium mb-6 lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>select a playlist</h2>
            
            <div className="space-y-3 mb-8">
              {playlists.map(playlist => (
                <div 
                  key={playlist.id}
                  className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-md p-4 shadow-md transition duration-200 cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <div className="flex items-center">
                    <div className="mr-3" style={{ color: playlist.color }}>
                      <i className={`${playlist.icon} text-xl`}></i>
                    </div>
                    <h3 className={`font-medium lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{playlist.name.toLowerCase()}</h3>
                  </div>
                </div>
              ))}
              
              <div 
                className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-md p-4 shadow-md transition duration-200 cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                onClick={() => setShowCreatePlaylist(true)}
              >
                <div className="flex items-center">
                  <div className="text-primary mr-3">
                    <i className="ri-add-line text-xl"></i>
                  </div>
                  <h3 className={`font-medium lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>create new playlist</h3>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Upload Options */}
        {showUploadOptions && selectedPlaylist && (
          <div>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Button 
                  variant="ghost" 
                  className={`mr-4 p-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'} rounded-full`} 
                  onClick={handleBackToPlaylists}
                >
                  <i className="ri-arrow-left-line text-xl"></i>
                </Button>
                <h2 className={`text-xl font-medium lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPlaylist.name.toLowerCase()}</h2>
              </div>
              <p className={`text-sm lowercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>select how you want to add your audio</p>
            </div>
            
            <div className="flex flex-col space-y-4">
              <label className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-6 rounded-lg flex items-center justify-center transition duration-200 cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: selectedPlaylist.color }}
                  >
                    <i className="ri-upload-cloud-fill text-white text-3xl"></i>
                  </div>
                  <h3 className={`font-medium text-lg lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>upload audio file</h3>
                  <p className={`text-sm mt-2 lowercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>mp3, wav, m4a files supported</p>
                </div>
              </label>
              
              <button 
                className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-6 rounded-lg flex items-center justify-center transition duration-200 cursor-pointer border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                onClick={handleShowRecorder}
              >
                <div className="text-center">
                  <div className="bg-primary w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                    <i className="ri-mic-fill text-white text-3xl"></i>
                  </div>
                  <h3 className={`font-medium text-lg lowercase ${darkMode ? 'text-white' : 'text-gray-900'}`}>record new audio</h3>
                  <p className={`text-sm mt-2 lowercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>record directly from your device</p>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {/* Recorder Interface */}
        {showRecorder && selectedPlaylist && (
          <Recorder 
            categoryId={0} // Not using categories anymore
            categoryName={selectedPlaylist.name}
            onSaveComplete={handleRecorderComplete}
            onCancel={handleRecorderBack}
            playlists={playlists}
          />
        )}
      </div>
      
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
    </div>
  );
}