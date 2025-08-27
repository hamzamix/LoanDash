export const CURRENT_VERSION = '1.2.0';
export const GITHUB_REPO = 'hamzamix/LoanDash';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface VersionInfo {
  current: string;
  latest?: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

export const checkForUpdates = async (): Promise<VersionInfo> => {
  const defaultResult: VersionInfo = {
    current: CURRENT_VERSION,
    hasUpdate: false,
    releaseUrl: GITHUB_RELEASES_URL,
  };

  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      console.warn('Failed to check for updates:', response.status);
      return defaultResult;
    }

    const release = await response.json();
    const latestVersion = release.tag_name?.replace(/^v/, '') || release.name?.replace(/^v/, '');
    
    if (!latestVersion) {
      return defaultResult;
    }

    const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;

    return {
      current: CURRENT_VERSION,
      latest: latestVersion,
      hasUpdate,
      releaseUrl: release.html_url || GITHUB_RELEASES_URL,
    };
  } catch (error) {
    console.warn('Error checking for updates:', error);
    return defaultResult;
  }
};

// Simple version comparison (assumes semantic versioning like x.y.z)
const compareVersions = (a: string, b: string): number => {
  const aParts = a.split('.').map(num => parseInt(num, 10));
  const bParts = b.split('.').map(num => parseInt(num, 10));
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  
  return 0;
};

export const openGitHubReleases = (url?: string) => {
  window.open(url || GITHUB_RELEASES_URL, '_blank', 'noopener,noreferrer');
};