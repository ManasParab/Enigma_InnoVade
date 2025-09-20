import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CalendarIcon, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../store/auth-store";
import { toast } from "sonner@2.0.3";

export function LogVitalsModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  const { user } = useAuthStore();
  const firstName = user?.fullName.split(' ')[0] || 'Friend';
  
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    weight: "",
    temperature: "",
    mood: "",
    notes: "",
  });

  const resetForm = () => {
    setVitals({
      bloodPressureSystolic: "",
      bloodPressureDiastolic: "",
      heartRate: "",
      weight: "",
      temperature: "",
      mood: "",
      notes: "",
    });
    setStep(1);
    setDate(new Date());
  };

  const handleSave = () => {
    // Handle saving vitals data
    console.log("Saving vitals:", { date, ...vitals });
    setOpen(false);
    resetForm();
    
    // Show success toast
    toast.success("Thank you for logging! Every entry helps build a clearer picture of your health.", {
      description: "Your vitals have been saved and will help us provide better recommendations.",
      duration: 5000,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const moodOptions = [
    { value: "great", label: "😊", description: "Great" },
    { value: "good", label: "🙂", description: "Good" },
    { value: "okay", label: "😐", description: "Okay" },
    { value: "stressed", label: "😰", description: "Stressed" },
    { value: "tired", label: "😴", description: "Tired" },
    { value: "unwell", label: "😷", description: "Unwell" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-positive hover:bg-positive/90 z-40 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
          <Plus className="h-6 w-6 text-white" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? `Good day, ${firstName}!` : "How are you feeling?"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 
                ? "Let's log your vitals for today. Take your time - every reading helps us understand your health better."
                : "Your feelings and experiences are just as important as the numbers. This helps us provide more personalized care."
              }
            </DialogDescription>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-positive' : 'bg-gray-200'}`} />
              <div className={`w-8 h-0.5 ${step > 1 ? 'bg-positive' : 'bg-gray-200'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-positive' : 'bg-gray-200'}`} />
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {step === 1 ? (
              <>
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => newDate && setDate(newDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Blood Pressure */}
                <div className="space-y-2">
                  <Label>Blood Pressure (mmHg)</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Systolic"
                        value={vitals.bloodPressureSystolic}
                        onChange={(e) => handleInputChange("bloodPressureSystolic", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-center px-2">
                      <span className="text-gray-500">/</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Diastolic"
                        value={vitals.bloodPressureDiastolic}
                        onChange={(e) => handleInputChange("bloodPressureDiastolic", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    placeholder="72"
                    value={vitals.heartRate}
                    onChange={(e) => handleInputChange("heartRate", e.target.value)}
                  />
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="150.0"
                    value={vitals.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°F)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={vitals.temperature}
                    onChange={(e) => handleInputChange("temperature", e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-positive hover:bg-positive/90"
                    onClick={handleNext}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Mood Selection */}
                <div className="space-y-3">
                  <Label>How are you feeling today?</Label>
                  <RadioGroup value={vitals.mood} onValueChange={(value) => handleInputChange("mood", value)}>
                    <div className="grid grid-cols-3 gap-3">
                      {moodOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            vitals.mood === option.value
                              ? 'border-positive bg-positive/10'
                              : 'border-gray-200 hover:border-positive/50'
                          }`}
                        >
                          <RadioGroupItem value={option.value} className="sr-only" />
                          <span className="text-2xl mb-1">{option.label}</span>
                          <span className="text-xs text-gray-600">{option.description}</span>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Any notes for today? (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="How are you feeling? Any symptoms, concerns, or positive observations you'd like to share..."
                    rows={4}
                    value={vitals.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-positive hover:bg-positive/90"
                    onClick={handleSave}
                  >
                    Save Entry
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}