import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { X, Leaf } from "lucide-react";
import { useState } from "react";

interface NudgeCardProps {
  title: string;
  tip: string;
  icon?: React.ReactNode;
}

export function NudgeCard({ title, tip, icon = <Leaf className="h-8 w-8 text-green-600" /> }: NudgeCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-green-800 mb-1">
              {title}
            </h3>
            <p className="text-sm text-green-700">
              {tip}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}