import { Report } from '../lib/supabase';

const OFFLINE_REPORTS_KEY = 'sentry_jamii_offline_reports';

export interface OfflineReport extends Omit<Report, 'id' | 'created_at' | 'updated_at'> {
  tempId: string;
  imageDataUrl: string;
  timestamp: string;
}

export const saveOfflineReport = (report: OfflineReport): void => {
  try {
    const existingReports = getOfflineReports();
    const updatedReports = [...existingReports, report];
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updatedReports));
  } catch (error) {
    console.error('Error saving offline report:', error);
  }
};

export const getOfflineReports = (): OfflineReport[] => {
  try {
    const reports = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return reports ? JSON.parse(reports) : [];
  } catch (error) {
    console.error('Error getting offline reports:', error);
    return [];
  }
};

export const clearOfflineReports = (): void => {
  try {
    localStorage.removeItem(OFFLINE_REPORTS_KEY);
  } catch (error) {
    console.error('Error clearing offline reports:', error);
  }
};

export const syncOfflineReports = async (): Promise<void> => {
  // This would be implemented to sync with Supabase when online
  // For now, we'll just clear the offline reports
  clearOfflineReports();
};