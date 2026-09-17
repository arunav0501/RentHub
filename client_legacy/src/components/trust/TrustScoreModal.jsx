import React from 'react';
import { X, ShieldCheck, CheckCircle2, Info, Award } from 'lucide-react';

const tierColorMap = {
  green: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    bar: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
};

const TrustScoreModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const colorStyles = tierColorMap[data.tierColor] || tierColorMap.blue;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all z-10">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                RentHub Trust Score
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.name} • {data.role === 'OWNER' ? 'Owner Reputation' : 'Renter Reputation'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Big Score Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800/80">
            <div className="inline-flex items-center gap-2 mb-2">
              <Award className={`h-5 w-5 ${colorStyles.text}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${colorStyles.badge}`}>
                {data.tier} {data.isNewMember ? '• New Member' : ''}
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-2 mb-3">
              <span className={`text-5xl font-black tracking-tight ${colorStyles.text}`}>
                {data.score}
              </span>
              <span className="text-xl font-semibold text-slate-400 dark:text-slate-500">
                / 100
              </span>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full ${colorStyles.bar} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(5, data.score)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data.isNewMember 
                ? 'Neutral starting score applied for new members. Increases with completed rentals.'
                : 'Score calculated dynamically from verified activity and transactions.'}
            </p>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Score Breakdown
            </h4>
            <div className="space-y-3">
              {data.breakdown?.map((item, idx) => {
                const percent = Math.round((item.score / item.maxScore) * 100);
                return (
                  <div key={idx} className="bg-white dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.category}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.score} <span className="text-xs text-slate-400">/ {item.maxScore}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Positive Indicators */}
          {data.indicators && data.indicators.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Trust Indicators
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.indicators.map((indicator, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{indicator.replace(/^✓\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparency Info Box */}
          <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3.5 rounded-2xl border border-blue-100/80 dark:border-blue-900/30 flex gap-3 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              RentHub Trust Scores are calculated securely on the server using verified rental history, profile verification, and cancellation records. Scores cannot be artificially inflated.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-right">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium text-sm transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreModal;
