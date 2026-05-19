import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostStepperProps {
  currentStep: number;
  steps: { title: string; description?: string }[];
}

export function PostStepper({ currentStep, steps }: PostStepperProps) {
  return (
    <div className="w-full mb-10 pt-2">
      <div className="flex items-start justify-between relative max-w-3xl mx-auto">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-5 w-full h-[3px] bg-gray-200 -z-10 rounded-full" />
        
        {/* Active Progress Bar */}
        <div 
          className="absolute left-0 top-5 h-[3px] bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(Math.max(0, currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <div key={index} className="flex flex-col items-center gap-2 relative bg-gray-50/0 z-10 px-2 w-24 sm:w-32">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold border-2 transition-colors duration-300",
                  isActive ? "border-primary bg-white text-primary shadow-sm" :
                  isCompleted ? "border-primary bg-primary text-white" :
                  "border-gray-200 bg-white text-gray-400"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-[13px] font-bold leading-tight",
                  isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-[11px] text-gray-500 hidden sm:block mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
