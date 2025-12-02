import React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';
import type { AnalysisStep } from '../types';

interface AnalysisProgressProps {
  steps: AnalysisStep[];
  currentStep: number;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps, currentStep }) => {
  const getStepIcon = (step: AnalysisStep, _index: number) => {
    if (step.status === 'complete') {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      );
    }
    if (step.status === 'active') {
      return (
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center animate-pulse-glow">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>
      );
    }
    if (step.status === 'error') {
      return (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-sm">!</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <Circle className="h-4 w-4 text-gray-400" />
      </div>
    );
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Analyzing Manuscript</h3>
        <span className="text-sm font-medium text-violet-600">
          {Math.round(progress)}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
              step.status === 'active'
                ? 'bg-violet-50'
                : step.status === 'complete'
                ? 'bg-gray-50'
                : ''
            }`}
          >
            {getStepIcon(step, index)}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  step.status === 'active'
                    ? 'text-violet-700'
                    : step.status === 'complete'
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p
                  className={`text-sm ${
                    step.status === 'active'
                      ? 'text-violet-500'
                      : step.status === 'complete'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </p>
              )}
            </div>
            {step.status === 'complete' && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                Done
              </span>
            )}
            {step.status === 'active' && (
              <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded">
                Processing
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Processing Indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>Analyzing your manuscript</span>
      </div>
    </div>
  );
};

export default AnalysisProgress;
