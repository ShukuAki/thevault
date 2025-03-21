import { useLocation } from "wouter";

interface FooterProps {
  darkMode?: boolean;
}

export default function Footer({ darkMode = false }: FooterProps) {
  const [location, setLocation] = useLocation();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t z-10 shadow-md`}>
      <div className="flex justify-around">
        <button 
          onClick={() => setLocation("/")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/" ? "text-primary" : darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <i className={`${location === "/" ? "ri-archive-fill" : "ri-archive-line"} text-xl`}></i>
          <span className="text-xs mt-1 lowercase">vault</span>
        </button>
        <button 
          onClick={() => setLocation("/upload")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/upload" ? "text-primary" : darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <i className={`${location === "/upload" ? "ri-upload-2-fill" : "ri-upload-2-line"} text-xl`}></i>
          <span className="text-xs mt-1 lowercase">upload</span>
        </button>
        <button 
          onClick={() => setLocation("/profile")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/profile" ? "text-primary" : darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <i className={`${location === "/profile" ? "ri-user-fill" : "ri-user-line"} text-xl`}></i>
          <span className="text-xs mt-1 lowercase">profile</span>
        </button>
      </div>
    </nav>
  );
}
