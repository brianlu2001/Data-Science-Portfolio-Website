import { apiRequest } from '@/lib/queryClient';

export interface AnalyticsEvent {
  page?: string;
  projectId?: number;
  clickType?: 'view' | 'report' | 'github';
}

class AnalyticsTracker {
  private isDebug = process.env.NODE_ENV === 'development';
  
  private log(message: string, data?: any) {
    if (this.isDebug) {
      console.log(`[Analytics] ${message}`, data);
    }
  }

  async trackPageView(page: string) {
    try {
      this.log(`Page view: ${page}`);
      const response = await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.log(`Failed to track page view: ${page}`, error);
    }
  }

  async trackProjectClick(projectId: number, clickType: 'view' | 'report' | 'github') {
    try {
      this.log(`Project click: ${projectId} - ${clickType}`);
      const response = await fetch('/api/analytics/project-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, clickType }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.log(`Failed to track project click: ${projectId}`, error);
    }
  }

  // Debounced page view tracking to avoid excessive requests
  private pageViewTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  trackPageViewDebounced(page: string, delay: number = 1000) {
    const existing = this.pageViewTimeouts.get(page);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      this.trackPageView(page);
      this.pageViewTimeouts.delete(page);
    }, delay);
    
    this.pageViewTimeouts.set(page, timeout);
  }
}

export const analytics = new AnalyticsTracker();

// Hook for easy usage in components
export function useAnalytics() {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackPageViewDebounced: analytics.trackPageViewDebounced.bind(analytics),
    trackProjectClick: analytics.trackProjectClick.bind(analytics),
  };
}