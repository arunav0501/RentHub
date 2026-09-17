import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';
import TrustScoreModal from './TrustScoreModal';

const tierBadgeStyles = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

const TrustScoreBadge = ({ userId, role = 'OWNER', initialData = null, size = 'md', showTier = true }) => {
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
        console.error('Failed to load trust score', err);
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
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Trust Score...</span>
      </span>
    );
  }

  if (!data) return null;

  const styleClass = tierBadgeStyles[data.tierColor] || tierBadgeStyles.blue;
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all duration-200 hover:scale-105 cursor-pointer shadow-xs ${styleClass} ${
          isSmall
            ? 'px-2 py-0.5 text-xs'
            : isLarge
            ? 'px-3.5 py-1.5 text-sm'
            : 'px-2.5 py-1 text-xs'
        }`}
        title="Click to view RentHub Trust Score Breakdown"
      >
        <ShieldCheck className={isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        <span>{data.score}/100</span>
        {showTier && (
          <span className="opacity-80 font-normal">
            • {data.isNewMember ? 'New' : data.tier}
          </span>
        )}
      </button>

      <TrustScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
      />
    </>
  );
};

export default TrustScoreBadge;
