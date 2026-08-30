import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface DisclaimerBannerProps {
  type?: 'draft_ai' | 'verified' | 'emergency';
  customText?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ type = 'draft_ai', customText }) => {
  if (type === 'verified') {
    return (
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-3 text-emerald-900 text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold">Physician Verified & Clinically Approved:</span>{' '}
          {customText || 'This clinical intake and history has been reviewed, modified, and confirmed by the attending doctor.'}
        </div>
      </div>
    );
  }

  if (type === 'emergency') {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center gap-3 text-red-900 text-sm animate-pulse">
        <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <span className="font-bold text-base block text-red-700">EMERGENCY RED-FLAG SAFETY ALERT</span>
          {customText || 'Possible emergency symptoms detected. Normal kiosk flow paused. Please proceed to the Emergency Triage counter immediately.'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex items-center gap-3 text-amber-900 text-xs sm:text-sm">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
      <div>
        <span className="font-semibold uppercase tracking-wider text-[11px] bg-amber-200/80 px-2 py-0.5 rounded mr-2">
          AI-Generated Draft
        </span>
        <span>
          {customText || 'Information extracted from patient responses and available records. Mandatory physician review & verification required before diagnosis.'}
        </span>
      </div>
    </div>
  );
};
