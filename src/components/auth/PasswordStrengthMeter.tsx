import React from 'react';
import { evaluatePasswordStrength } from '../../lib/auth-validators';
import { Check, X } from './icons';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);
  const { score, level, meetsRequirements } = result;

  const getBarColor = (index: number) => {
    if (index >= score) return 'bg-neutral-200';
    if (score <= 1) return 'bg-[#E51E2B]';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-blue-600';
    return 'bg-emerald-600';
  };

  const getLevelTextColor = () => {
    if (level === 'Weak') return 'text-[#E51E2B]';
    if (level === 'Fair') return 'text-amber-600';
    if (level === 'Good') return 'text-blue-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-2 pt-1 font-mono text-[11px]">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-neutral-500">Security Strength:</span>
        <span className={getLevelTextColor()}>{level}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map(idx => (
          <div
            key={idx}
            className={`rounded-full transition-colors duration-200 ${getBarColor(idx)}`}
          />
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px] text-neutral-600">
        <div className="flex items-center gap-1.5">
          {meetsRequirements.minLength ? (
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-neutral-300 shrink-0" />
          )}
          <span className={meetsRequirements.minLength ? 'text-neutral-900 font-semibold' : ''}>
            8+ Characters
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {meetsRequirements.hasUppercase ? (
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-neutral-300 shrink-0" />
          )}
          <span className={meetsRequirements.hasUppercase ? 'text-neutral-900 font-semibold' : ''}>
            Uppercase (A-Z)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {meetsRequirements.hasLowercase ? (
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-neutral-300 shrink-0" />
          )}
          <span className={meetsRequirements.hasLowercase ? 'text-neutral-900 font-semibold' : ''}>
            Lowercase (a-z)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {meetsRequirements.hasNumber || meetsRequirements.hasSpecial ? (
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-neutral-300 shrink-0" />
          )}
          <span className={(meetsRequirements.hasNumber || meetsRequirements.hasSpecial) ? 'text-neutral-900 font-semibold' : ''}>
            Number or Symbol
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
