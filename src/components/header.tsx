import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Heart, User, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "../store/auth-store";

export function Header() {
  const { user, logout } = useAuthStore();
  
  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const firstName = user?.fullName.split(' ')[0] || 'Friend';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-positive rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">VitalCircle</span>
          </div>

          {/* Personalized Greeting */}
          <div className="hidden md:block text-center">
            <p className="text-lg font-medium text-gray-900">
              {getTimeOfDayGreeting()}, {firstName}
            </p>
            <p className="text-sm text-gray-600">
              Let's take a moment for your well-being
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-primary/10">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-positive/10">
              Log Today's Vitals
            </Button>
          </nav>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-primary/10 p-1">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" />
                <AvatarFallback className="bg-primary text-white">
                  {firstName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}