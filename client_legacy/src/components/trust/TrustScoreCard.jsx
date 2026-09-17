import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import TrustScoreModal from './TrustScoreModal';

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

const TrustScoreCard = ({ userId, role = 'OWNER', initialData = null }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData && Boolean(userId));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      return;
    }
    if (!userId) return;

    let isMounted = true;
    const fetchScore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/${userId}/trust-score?role=${role}`);
        if (isMounted) setData(res.data);
      } catch (err) {
        console.error('Failed to load trust score card', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScore();
    return () => {
      isMounted = false;
    };
  }, [userId, role, initialData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[220px]">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs font-medium">Calculating Trust Score...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const colorStyles = tierColorMap[data.tierColor] || tierColorMap.blue;
  const topIndicators = data.indicators ? data.indicators.slice(0, 3) : [];

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              RentHub Trust Score
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorStyles.badge}`}>
            {data.tier}
          </span>
        </div>

        {/* Big Score Display */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-4xl font-black ${colorStyles.text}`}>
            {data.score}
          </span>
          <span className="text-sm font-semibold text-slate-400">
            / 100
          </span>
          {data.isNewMember && (
            <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-medium">
              New Member
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full ${colorStyles.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(5, data.score)}%` }}
          />
        </div>

        {/* Indicators List */}
        <div className="space-y-2 mb-4">
          {topIndicators.map((ind, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{ind.replace(/^✓\s*/, '')}</span>
            </div>
          ))}
        </div>

        {/* View Breakdown CTA */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-primary hover:text-primary-dark transition-colors group cursor-pointer"
        >
          <span>View breakdown & factors</span>
          <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <TrustScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
      />
    </>
  );
};

export default TrustScoreCard;
