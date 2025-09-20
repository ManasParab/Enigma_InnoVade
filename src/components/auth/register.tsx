import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useAuthStore } from "../../store/auth-store";
import { Heart, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const healthConditions = [
  "Hypertension",
  "Type 2 Diabetes",
  "Type 1 Diabetes",
  "COPD",
  "Asthma",
  "Heart Disease",
  "Chronic Kidney Disease",
  "Arthritis",
  "Depression",
  "Anxiety",
  "Other"
];

export function Register({ onSwitchToLogin }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    healthConditions: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isLoading } = useAuthStore();

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    
    if (!formData.fullName) newErrors.fullName = "Full name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        healthConditions: formData.healthConditions,
      });
      toast.success("Welcome to VitalCircle! We're excited to support your health journey.");
    } catch (error) {
      toast.error("Unable to create account. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const toggleHealthCondition = (condition: string) => {
    const updated = formData.healthConditions.includes(condition)
      ? formData.healthConditions.filter(c => c !== condition)
      : [...formData.healthConditions, condition];
    handleInputChange("healthConditions", updated);
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["", "destructive", "warning", "warning", "positive", "positive"];
    
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/20 via-background to-positive/20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">VitalCircle</h1>
          <p className="text-gray-600 mt-2">Your supportive health companion</p>
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle>
              {step === 1 ? "Create Your Account" : "Your Health Profile"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Join thousands who trust VitalCircle with their health"
                : "We're here to support you. Let's personalize your experience."
              }
            </CardDescription>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-positive' : 'bg-gray-200'}`} />
              <div className={`w-8 h-0.5 ${step > 1 ? 'bg-positive' : 'bg-gray-200'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-positive' : 'bg-gray-200'}`} />
            </div>
          </CardHeader>
          
          <CardContent>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {formData.password && (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${passwordStrength.color} transition-all`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs text-${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="w-full bg-positive hover:bg-positive/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label>Primary Health Conditions (Optional)</Label>
                  <p className="text-sm text-gray-600">
                    Help us personalize your experience by selecting any conditions you're managing.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {healthConditions.map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => toggleHealthCondition(condition)}
                        className={`p-2 text-sm rounded-md border transition-all ${
                          formData.healthConditions.includes(condition)
                            ? 'bg-positive text-white border-positive'
                            : 'bg-white border-gray-200 hover:border-positive'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{condition}</span>
                          {formData.healthConditions.includes(condition) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-positive hover:bg-positive/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto"
                  onClick={onSwitchToLogin}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}