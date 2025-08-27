import React, { useState, useEffect } from 'react';
import { VersionInfo, checkForUpdates, openGitHubReleases } from '../utils/version';

interface UpdateNotificationProps {
  onClose?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const info = await checkForUpdates();
        setVersionInfo(info);
        
        // Only show notification if there's an update available
        if (info.hasUpdate) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to fetch version info:', error);
      }
    };

    // Check for updates on component mount
    fetchVersionInfo();
    
    // Check for updates every 30 minutes
    const interval = setInterval(fetchVersionInfo, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUpdateClick = () => {
    if (versionInfo) {
      openGitHubReleases(versionInfo.releaseUrl);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !versionInfo?.hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75l3 3 6-6" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Update Available!
            </h3>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Version {versionInfo.latest} is now available. You're currently on v{versionInfo.current}.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleUpdateClick}
                className="text-xs font-medium text-green-800 dark:text-green-200 bg-green-200 dark:bg-green-800/50 hover:bg-green-300 dark:hover:bg-green-700/50 px-2 py-1 rounded transition-colors"
              >
                View Release
              </button>
              <button
                onClick={handleClose}
                className="text-xs font-medium text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-green-400 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;