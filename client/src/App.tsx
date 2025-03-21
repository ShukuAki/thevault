import { Switch, Route } from "wouter";
import Footer from "./components/Footer";
import VaultPage from "./pages/Vault";
import UploadPage from "./pages/Upload";
import ProfilePage from "./pages/Profile";
import AudioPlayer from "./components/AudioPlayer";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Track } from "@shared/schema";
import SplashPage from "./pages/SplashPage";

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [visited, setVisited] = useState(false);

  // Check if user has visited before
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (hasVisited) {
      setVisited(true);
    }
  }, []);

  // Set visited status when navigating away from splash
  const handleVisit = () => {
    localStorage.setItem('hasVisitedBefore', 'true');
    setVisited(true);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={toggleDarkMode} 
          className={`p-2.5 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      <Switch>
        <Route path="/" component={() => {
          if (!visited) {
            return <SplashPage onComplete={handleVisit} />;
          } else {
            return <VaultPage onPlayTrack={(track) => {
              setCurrentTrack(track);
              setIsPlaying(true);
            }} darkMode={darkMode} />;
          }
        }} />
        <Route path="/vault" component={() => <VaultPage onPlayTrack={(track) => {
          setCurrentTrack(track);
          setIsPlaying(true);
        }} darkMode={darkMode} />} />
        <Route path="/upload" component={() => <UploadPage darkMode={darkMode} />} />
        <Route path="/profile" component={() => <ProfilePage darkMode={darkMode} />} />
        <Route component={NotFound} />
      </Switch>

      <Footer darkMode={darkMode} />
      
      {currentTrack && (
        <AudioPlayer 
          track={currentTrack} 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => setCurrentTrack(null)}
          darkMode={darkMode}
        />
      )}
      
      <Toaster />
    </div>
  );
}

export default App;
