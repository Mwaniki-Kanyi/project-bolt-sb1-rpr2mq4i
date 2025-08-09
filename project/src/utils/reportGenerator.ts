import jsPDF from 'jspdf';
import { Report } from '../lib/supabase';

export const generateReportPDF = async (report: Report, imageDataUrl: string): Promise<void> => {
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(20);
  pdf.text('Sentry Jamii Wildlife Report', 20, 30);
  
  // Add report details
  pdf.setFontSize(12);
  pdf.text(`Report ID: ${report.id}`, 20, 50);
  pdf.text(`Animal Type: ${report.animal_type}`, 20, 60);
  pdf.text(`Date: ${new Date(report.created_at).toLocaleDateString()}`, 20, 70);
  pdf.text(`Time: ${new Date(report.created_at).toLocaleTimeString()}`, 20, 80);
  pdf.text(`Location: ${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`, 20, 90);
  pdf.text(`Status: ${report.status}`, 20, 100);
  
  // Add image if available
  if (imageDataUrl) {
    try {
      pdf.addImage(imageDataUrl, 'JPEG', 20, 110, 100, 75);
    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }
  }
  
  // Download the PDF
  pdf.save(`wildlife-report-${report.id}.pdf`);
};