import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAuthStore } from "../store/auth-store";

interface StabilityScoreCardProps {
  score: number;
  aiSummary: string;
}

export function StabilityScoreCard({ score, aiSummary }: StabilityScoreCardProps) {
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ')[0] || 'Friend';

  // Determine status based on score
  const getStatusInfo = (score: number) => {
    if (score >= 75) {
      return {
        status: "Feeling Stable",
        colorClass: "text-positive",
        strokeClass: "stroke-positive",
        borderClass: "border-positive/30",
        bgClass: "bg-positive/5",
        message: `Great job, ${firstName}. Your recent efforts are showing in your stable vitals. Your risk of complications remains low, and we're here to support you in maintaining this positive trend.`
      };
    } else if (score >= 50) {
      return {
        status: "Needs Attention",
        colorClass: "text-warning",
        strokeClass: "stroke-warning",
        borderClass: "border-warning/30",
        bgClass: "bg-warning/5",
        message: `It looks like things have been a bit challenging lately, and that's completely okay, ${firstName}. Your readings are trending higher, so let's focus on some gentle actions today to bring things back into balance. You're not alone in this journey.`
      };
    } else {
      return {
        status: "Needs Care",
        colorClass: "text-destructive",
        strokeClass: "stroke-destructive",
        borderClass: "border-destructive/30",
        bgClass: "bg-destructive/5",
        message: `${firstName}, we understand that managing your health can feel overwhelming sometimes. Your current readings suggest we should take some immediate but gentle steps together. Remember, every small action counts, and we're here to support you.`
      };
    }
  };

  const statusInfo = getStatusInfo(score);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className={`border-2 ${statusInfo.borderClass} ${statusInfo.bgClass} transition-all duration-500 shadow-lg`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-center">Your Wellness Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative w-36 h-36">
            <svg
              className="w-36 h-36 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={`${statusInfo.strokeClass} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{score}</div>
                <div className="text-sm text-gray-500 -mt-1">Your Score</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-semibold ${statusInfo.colorClass} mb-2`}>
            {statusInfo.status}
          </div>
        </div>

        <div className="text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-lg">
          {statusInfo.message}
        </div>
      </CardContent>
    </Card>
  );
}