import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  colorClassName?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = 'h-2', colorClassName = 'bg-primary-600 dark:bg-primary-500' }) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${className}`}>
      <div
        className={`${colorClassName} rounded-full transition-all duration-500`}
        style={{ width: `${safeProgress}%`, height: '100%' }}
      ></div>
    </div>
  );
};

export default ProgressBar;