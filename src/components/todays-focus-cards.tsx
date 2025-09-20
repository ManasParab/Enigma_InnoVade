import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { X, Apple, Brain, Heart } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/auth-store";

interface FocusCard {
  id: string;
  category: "body" | "mind" | "soul";
  icon: React.ReactNode;
  title: string;
  tip: string;
  bgColor: string;
  iconColor: string;
}

export function TodaysFocusCards() {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ')[0] || 'Friend';
  
  const [dismissedCards, setDismissedCards] = useState<string[]>([]);

  const focusCards: FocusCard[] = [
    {
      id: "body",
      category: "body",
      icon: <Apple className="h-8 w-8" />,
      title: "Nourish Your Body",
      tip: `For your hypertension, a diet rich in potassium is beneficial, ${firstName}. How about adding a side of spinach or a banana to your lunch today? It's a small step that can make a big difference for your heart.`,
      bgColor: "bg-green-50 border-green-200",
      iconColor: "text-green-600"
    },
    {
      id: "mind",
      category: "mind",
      icon: <Brain className="h-8 w-8" />,
      title: "Care for Your Mind",
      tip: `We notice your stress levels have been a bit high, and that's completely normal, ${firstName}. Managing stress is key for heart health. Could you find 5 minutes today for a quiet breathing exercise? Your mind and body will thank you.`,
      bgColor: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      id: "soul",
      category: "soul",
      icon: <Heart className="h-8 w-8" />,
      title: "Connect Your Soul",
      tip: `Living with a chronic condition can feel isolating sometimes, ${firstName}. Reaching out to a friend or family member for a quick chat can boost your mood and reduce stress. A little connection goes a long way for your overall well-being.`,
      bgColor: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600"
    }
  ];

  const handleDismiss = (cardId: string) => {
    setDismissedCards(prev => [...prev, cardId]);
  };

  const visibleCards = focusCards.filter(card => !dismissedCards.includes(card.id));

  if (visibleCards.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-600">You've reviewed all your personalized recommendations for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Today's Focus: Mind, Body, & Soul
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Gentle reminders crafted just for you, based on your health journey and recent patterns.
      </p>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        {visibleCards.map((card) => (
          <Card key={card.id} className={`${card.bgColor} transition-all duration-300 hover:shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 ${card.iconColor}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {card.tip}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-white/50"
                  onClick={() => handleDismiss(card.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}