"use client";

import { jsPDF } from 'jspdf';
import { addMICRFont } from './micrFont';
import { addArabicFont } from './arabicFont';
// import ArabicReshaper from 'arabic-reshaper';

interface CheckData {
  serialNumber: string;
  accountNumber?: string;
  accountHolderName: string;
  checkSize: { width: number; height: number; unit: string };
  branchNameX?: number;
  branchNameY?: number;
  branchNameFontSize?: number;
  branchNameAlign?: string;
  serialNumberX?: number;
  serialNumberY?: number;
  serialNumberFontSize?: number;
  serialNumberAlign?: string;
  accountNumberX?: number;
  accountNumberY?: number;
  accountNumberFontSize?: number;
  accountNumberAlign?: string;
  checkSequenceX?: number;
  checkSequenceY?: number;
  checkSequenceFontSize?: number;
  checkSequenceAlign?: string;
  accountHolderNameX?: number;
  accountHolderNameY?: number;
  accountHolderNameFontSize?: number;
  accountHolderNameAlign?: string;
  micrLineX?: number;
  micrLineY?: number;
  micrLineFontSize?: number;
  micrLineAlign?: string;
  micrLine: string;
}

interface CheckbookData {
  operation: {
    accountNumber: string;
    branchName: string;
    [key: string]: any;
  };
  checks: CheckData[];
}

/**
 * Process Arabic text for RTL display
 */
function processArabicText(text: string): string {
  if (!text) return '';

  try {
    // Check if text contains Arabic
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    if (!arabicPattern.test(text)) return text;

    // With a proper Arabic font like Cairo, we might not need reshaping if the font handles ligatures,
    // but jsPDF often needs explicit reshaping.
    // Since we disabled the library, we will try to rely on the font or simple reversing for now.
    // If the font supports ligatures properly, we might just need to reverse the words/characters.

    // Ideally: import ArabicReshaper from 'arabic-reshaper';
    // const reshaped = ArabicReshaper.convertArabic(text);
    // return reshaped.split('').reverse().join('');

    // For now, simple reverse to test the font rendering
    // Note: This won't connect letters correctly without reshaper, but will verify font loading.
    return text.split('').reverse().join('');
  } catch (e) {
    console.warn('Error processing Arabic text:', e);
    return text;
  }
}

/**
 * Generate PDF from checkbook data using jsPDF
 */
export async function generateCheckbookPDF(checkbookData: CheckbookData): Promise<Blob> {
  const firstCheck = checkbookData.checks[0];
  const pageWidth = firstCheck.checkSize.width; // mm
  const pageHeight = firstCheck.checkSize.height; // mm

  // Create PDF

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  // Add Fonts

  try {
    await addMICRFont(pdf);
    addArabicFont(pdf);
  } catch (e) {
    console.error('Error adding fonts:', e);
  }

  // Process each check
  checkbookData.checks.forEach((check, index) => {
    // Add new page for each check (except first)
    if (index > 0) {
      pdf.addPage([check.checkSize.width, check.checkSize.height]);
    }

    // Debug Log


    // Branch Name (Arabic - RTL)
    if (check.branchNameX !== undefined && check.branchNameY !== undefined) {
      pdf.setFontSize(check.branchNameFontSize || 12);
      pdf.setFont('Cairo', 'normal'); // Use Arabic Font

      const x = check.branchNameX;
      const y = check.branchNameY;

      // Process Arabic text
      const branchName = processArabicText(checkbookData.operation.branchName);

      // Always use the configured X as the anchor point
      pdf.text(branchName, x, y, { align: check.branchNameAlign as 'left' | 'center' | 'right' || 'center' });
    }

    // Account Number
    if (check.accountNumberX !== undefined && check.accountNumberY !== undefined && check.accountNumber) {
      pdf.setFontSize(check.accountNumberFontSize || 12);
      pdf.setFont('courier', 'bold');

      const x = check.accountNumberX;
      const y = check.accountNumberY;

      // Always use the configured X as the anchor point
      pdf.text(check.accountNumber, x, y, { align: check.accountNumberAlign as 'left' | 'center' | 'right' || 'center' });
    }

    // Serial Number
    if (check.serialNumberX !== undefined && check.serialNumberY !== undefined) {
      pdf.setFontSize(check.serialNumberFontSize || 10);
      pdf.setFont('courier', 'bold');

      const x = check.serialNumberX;
      const y = check.serialNumberY;

      // Always use the configured X as the anchor point
      pdf.text(check.serialNumber, x, y, { align: check.serialNumberAlign as 'left' | 'center' | 'right' || 'right' });
    }

    // Check Sequence (same as serial number)
    if (check.checkSequenceX !== undefined && check.checkSequenceY !== undefined) {
      pdf.setFontSize(check.checkSequenceFontSize || 10);
      pdf.setFont('courier', 'bold');

      const x = check.checkSequenceX;
      const y = check.checkSequenceY;

      // Use the same serial number as the main serial number
      pdf.text(check.serialNumber, x, y, { align: check.checkSequenceAlign as 'left' | 'center' | 'right' || 'left' });
    }

    // Account Holder Name (Arabic - RTL)
    if (check.accountHolderNameX !== undefined && check.accountHolderNameY !== undefined) {
      pdf.setFontSize(check.accountHolderNameFontSize || 10);
      pdf.setFont('Cairo', 'normal'); // Use Arabic Font

      const x = check.accountHolderNameX;
      const y = check.accountHolderNameY;

      // Process Arabic text
      const accountName = processArabicText(check.accountHolderName);

      // Always use the configured X as the anchor point
      pdf.text(accountName, x, y, { align: check.accountHolderNameAlign as 'left' | 'center' | 'right' || 'left' });
    }

    // MICR Line
    if (check.micrLineX !== undefined && check.micrLineY !== undefined) {
      pdf.setFontSize(check.micrLineFontSize || 10);
      pdf.setFont('MICR', 'normal');

      const x = check.micrLineX;
      const y = check.micrLineY;

      // Always use the configured X as the anchor point
      pdf.text(check.micrLine, x, y, { align: check.micrLineAlign as 'left' | 'center' | 'right' || 'center' });
    }
  });

  // Return as blob
  return pdf.output('blob');
}
