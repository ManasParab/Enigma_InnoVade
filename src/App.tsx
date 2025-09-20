import { useState, useEffect } from "react";
import { useAuthStore } from "./store/auth-store";
import { Login } from "./components/auth/login";
import { Register } from "./components/auth/register";
import { Header } from "./components/header";
import { StabilityScoreCard } from "./components/stability-score-card";
import { TodaysFocusCards } from "./components/todays-focus-cards";
import { ProgressDashboard } from "./components/progress-dashboard";
import { LogVitalsModal } from "./components/log-vitals-modal";
import { Toaster } from "./components/ui/sonner";

function Dashboard() {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ')[0] || 'Friend';
  
  // Mock data for demonstration - in a real app, this would come from an API
  const stabilityScore = 85;
  const aiSummary = `Based on your recent health data and ${user?.healthConditions.join(', ')} management, your wellness indicators are showing positive trends.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section - Only visible on larger screens since header shows greeting */}
          <div className="mb-8 md:hidden">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {firstName}
            </h1>
            <p className="text-gray-600">
              Let's take a moment for your well-being
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stability Score */}
            <div className="lg:col-span-1">
              <StabilityScoreCard 
                score={stabilityScore} 
                aiSummary={aiSummary}
              />
            </div>

            {/* Right Column - Progress and Focus */}
            <div className="lg:col-span-2 space-y-8">
              {/* Today's Focus Cards */}
              <TodaysFocusCards />

              {/* Progress Dashboard */}
              <ProgressDashboard />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Log Vitals */}
      <LogVitalsModal />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isInitializing, initializeAuth } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Initialize Firebase auth listener
    initializeAuth();
  }, [initializeAuth]);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-positive/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing VitalCircle...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid rgba(168, 218, 220, 0.3)',
              color: '#1f2937',
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      {authMode === 'login' ? (
        <Login onSwitchToRegister={() => setAuthMode('register')} />
      ) : (
        <Register onSwitchToLogin={() => setAuthMode('login')} />
      )}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid rgba(168, 218, 220, 0.3)',
            color: '#1f2937',
          },
        }}
      />
    </>
  );
}