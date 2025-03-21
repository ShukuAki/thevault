import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface SplashPageProps {
  onComplete: () => void;
}

export default function SplashPage({ onComplete }: SplashPageProps) {
  const [, setLocation] = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(8);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      setLocation('/vault');
    }, 8000);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [setLocation, onComplete]);
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-8 relative">
          <div className="text-black dark:text-white text-3xl font-medium tracking-wide absolute -top-16 left-1/2 transform -translate-x-1/2 w-full">
            <svg viewBox="0 0 500 100" className="w-full">
              <path id="curve" d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" fill="transparent" />
              <text width="500">
                <textPath xlinkHref="#curve" className="text-black dark:text-white">
                  pick up the phone
                </textPath>
              </text>
            </svg>
          </div>
          
          <div className="animate-bounce">
            <div className="w-40 h-40 bg-black dark:bg-gray-800 rounded-full flex items-center justify-center relative">
              <div className="w-32 h-32 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                <div className="w-28 h-28 bg-black dark:bg-gray-800 rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              
              {/* Phone Ringing Animation */}
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-60" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
          redirecting in {timeRemaining}s...
        </p>
      </div>
    </div>
  );
}