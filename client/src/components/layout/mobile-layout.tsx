import { useState, useEffect } from "react";
import { Store, Wifi, WifiOff } from "lucide-react";
import BottomNavigation from "./bottom-navigation";
import LanguageToggle from "@/components/ui/language-toggle";
import { useOffline } from "@/hooks/use-offline";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { isOffline } = useOffline();
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowOfflineIndicator(true);
    } else {
      // Hide indicator after 2 seconds when coming back online
      const timer = setTimeout(() => {
        setShowOfflineIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl relative">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md" data-testid="app-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Store className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="font-medium text-lg" data-testid="text-app-title">RetailSahayak</h1>
              <p className="text-blue-100 text-xs font-devanagari" data-testid="text-app-subtitle">
                स्मार्ट दुकान प्रबंधन
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageToggle />
            {/* Connection Status */}
            <div className="flex items-center" data-testid="connection-status">
              <div className={`w-2 h-2 rounded-full mr-1 ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-xs flex items-center">
                {isOffline ? (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Offline Indicator */}
      {showOfflineIndicator && isOffline && (
        <div 
          className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg"
          data-testid="offline-indicator"
        >
          <WifiOff className="h-4 w-4 mr-1 inline" />
          Working Offline
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" data-testid="main-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
