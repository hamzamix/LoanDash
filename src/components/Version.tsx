import React, { useState, useEffect } from 'react';
import { VersionInfo, checkForUpdates, openGitHubReleases } from '../utils/version';

interface VersionProps {
  className?: string;
}

export const Version: React.FC<VersionProps> = ({ className = '' }) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const info = await checkForUpdates();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to fetch version info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  const handleVersionClick = () => {
    if (versionInfo) {
      openGitHubReleases(versionInfo.releaseUrl);
    }
  };

  if (isLoading) {
    return (
      <div className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
        Loading...
      </div>
    );
  }

  return (
    <button
      onClick={handleVersionClick}
      className={`relative flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${className}`}
      title={versionInfo?.hasUpdate ? `New version ${versionInfo.latest} available!` : 'Click to view releases'}
    >
      <span className="text-slate-600 dark:text-slate-300">
        v{versionInfo?.current}
      </span>
      
      {versionInfo?.hasUpdate && (
        <span className="relative">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </span>
      )}
    </button>
  );
};

export default Version;