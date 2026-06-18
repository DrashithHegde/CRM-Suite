import React from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    new: {
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400',
      dot: 'bg-amber-500',
      label: 'New',
    },
    contacted: {
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      dot: 'bg-purple-500',
      label: 'Contacted',
    },
    converted: {
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      label: 'Converted',
    },
  };
  const c = config[status] || config.new;
  return (
    <span className={`badge ${status === 'new' ? 'badge-new' : status === 'contacted' ? 'badge-contacted' : status === 'converted' ? 'badge-converted' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mr-1.5`}></span>
      {c.label}
    </span>
  );
};

export default StatusBadge;
