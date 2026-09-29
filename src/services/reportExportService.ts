/**
 * METRALAB - Standardized Report Generation Service
 * Produces genuine downloadable PDF documents and editable MS Word (.docx) files
 * Compliant with OIML R 76-2 (Pattern Evaluation Report Format)
 */

import { jsPDF } from 'jspdf';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
  Packer,
} from 'docx';
import { saveAs } from 'file-saver';
import { Evaluation, LaboratorySettings, TestReport } from '../types';

export class ReportExportService {
  /**
   * Generates a genuine multi-page vector PDF test report as per OIML R 76-2 format
   */
  static generatePdfReport(
    report: TestReport,
    evaluation: Evaluation,
    settings: LaboratorySettings
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    // Header banner & Lab Identity
    doc.setFillColor(15, 23, 42); // deep navy
    doc.rect(14, y, pageWidth - 28, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.laboratoryName.toUpperCase(), 18, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Accreditation: ${settings.accreditationNumber} | ISO/IEC 17025 Accredited | Legal Metrology Act, 2009`,
      18,
      y + 14
    );
    doc.text(`${settings.addressLine1}, ${settings.cityStatePincode}`, 18, y + 19);

    y += 28;

    // Sample / Demo Warning Banner
    doc.setFillColor(254, 243, 199); // amber 100
    doc.setDrawColor(245, 158, 11);
    doc.rect(14, y, pageWidth - 28, 8, 'FD');
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'NOTICE: SAMPLE TEST REPORT — DEMONSTRATION RECORD AS PER OIML R 76-1 / R 76-2 FORMAT',
      pageWidth / 2,
      y + 5.5,
      { align: 'center' }
    );

    y += 13;

    // Document Title Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PATTERN EVALUATION TEST REPORT', 14, y);

    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Reference: ${report.reportNumber} (Rev. ${report.version}) | Date: ${new Date(report.generatedAt).toLocaleDateString()}`, 14, y);

    y += 8;

    // 1. Administrative & Instrument Specifications Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('1. Administrative Information & Technical Specifications', 14, y);
    y += 4;

    const specs = [
      ['Evaluation Number:', evaluation.evaluationNumber, 'Evaluation Type:', 'Type Evaluation (Model Approval)'],
      ['Manufacturer:', evaluation.manufacturerSnapshot.name, 'License / Ref:', evaluation.manufacturerSnapshot.licenseNumber || 'MFR-IND-2024'],
      ['Model Designation:', evaluation.instrumentSnapshot.modelDesignation, 'Serial Number:', evaluation.instrumentSnapshot.serialNumber],
      ['Accuracy Class:', `Class ${evaluation.instrumentSnapshot.accuracyClass}`, 'Instrument Type:', evaluation.instrumentSnapshot.type.replace(/_/g, ' ')],
      ['Max Capacity (Max):', `${evaluation.instrumentSnapshot.maxCapacity} ${evaluation.instrumentSnapshot.measurementUnit}`, 'Min Capacity (Min):', `${evaluation.instrumentSnapshot.minCapacity} ${evaluation.instrumentSnapshot.measurementUnit}`],
      ['Verification Interval (e):', `${evaluation.instrumentSnapshot.verificationInterval} ${evaluation.instrumentSnapshot.measurementUnit}`, 'Scale Interval (d):', `${evaluation.instrumentSnapshot.scaleInterval} ${evaluation.instrumentSnapshot.measurementUnit}`],
      ['Resolution (n = Max/e):', `${evaluation.instrumentSnapshot.calculatedN} intervals`, 'Temperature Range:', `${evaluation.instrumentSnapshot.operatingTempMin}°C to +${evaluation.instrumentSnapshot.operatingTempMax}°C`],
    ];

    doc.setFontSize(8);
    const col1 = 14;
    const col2 = 56;
    const col3 = 110;
    const col4 = 150;
    const rowH = 5;

    specs.forEach((row, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(col1, y - 3.5, pageWidth - 28, rowH, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(row[0], col1 + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(row[1], col2, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(row[2], col3 + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(row[3], col4, y);

      y += rowH;
    });

    y += 4;

    // 2. Environmental & Test Standards
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('2. Environmental Conditions & Standards Traceability', 14, y);
    y += 4;

    const envInfo = [
      `Ambient Temperature: ${evaluation.laboratoryConditions.ambientTempStart}°C to ${evaluation.laboratoryConditions.ambientTempEnd}°C`,
      `Relative Humidity: ${evaluation.laboratoryConditions.relativeHumidityStart}% to ${evaluation.laboratoryConditions.relativeHumidityEnd}%`,
      `Barometric Pressure: ${evaluation.laboratoryConditions.barometricPressureStart} hPa to ${evaluation.laboratoryConditions.barometricPressureEnd} hPa`,
      `Standard Weights: ${evaluation.laboratoryConditions.weightsSetReference} (Class ${evaluation.laboratoryConditions.weightsClass}) | Cert: ${evaluation.laboratoryConditions.weightsCalibrationCertNo}`,
      `Local Acceleration of Gravity: ${evaluation.laboratoryConditions.localGravityMs2} m/s²`,
    ];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    envInfo.forEach((item) => {
      doc.text(`• ${item}`, 16, y);
      y += 4.5;
    });

    y += 3;

    // 3. Test Observations Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('3. OIML R 76 Prescribed Metrological Test Outcomes', 14, y);
    y += 5;

    // Mini Table of Test Procedures
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 3.5, pageWidth - 28, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TEST PROCEDURE / CODE', 16, y);
    doc.text('CLAUSE REF.', 92, y);
    doc.text('EXECUTION STATUS', 132, y);
    doc.text('RESULT', 172, y);
    y += 6;

    const tests = Object.values(evaluation.testExecutions);
    tests.forEach((t) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      let title = t.testProcedureId.replace('oiml_', '').replace(/_/g, ' ').toUpperCase();
      let clause = 'OIML R 76-1';
      if (t.testProcedureId === 'oiml_a441_weighing') {
        title = 'Weighing Performance (0 -> Max -> 0)';
        clause = 'Clause 3.5.1 / A.4.4.1';
      } else if (t.testProcedureId === 'oiml_a442_repeatability') {
        title = 'Repeatability (3 series at 0.5 Max & Max)';
        clause = 'Clause 3.6.1 / A.4.4.2';
      } else if (t.testProcedureId === 'oiml_a47_eccentricity') {
        title = 'Eccentricity (Corner Load 1/3 Max)';
        clause = 'Clause 3.6.2 / A.4.7';
      } else if (t.testProcedureId === 'oiml_a45_discrimination') {
        title = 'Discrimination / Sensitivity (1.4 d)';
        clause = 'Clause 3.8 / A.4.5';
      } else if (t.testProcedureId === 'oiml_a48_zero_setting') {
        title = 'Zero-Setting Residual Error (<=0.25e)';
        clause = 'Clause 3.9 / A.4.8';
      } else if (t.testProcedureId === 'oiml_clauses4_functional') {
        title = 'Technical & Construction Requirements';
        clause = 'Clause 4';
      }

      doc.text(title, 16, y);
      doc.text(clause, 92, y);
      doc.text(t.isIncluded ? t.status.toUpperCase() : 'NOT APPLICABLE', 132, y);

      const verdictText = t.overallProcedureCompliance.toUpperCase().replace(/_/g, ' ');
      if (t.overallProcedureCompliance === 'pass') {
        doc.setTextColor(22, 101, 52); // green
        doc.setFont('helvetica', 'bold');
      } else if (t.overallProcedureCompliance === 'fail') {
        doc.setTextColor(185, 28, 28); // red
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.text(verdictText, 172, y);
      y += 5;
    });

    y += 5;

    // Check page space before conclusion
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    // 4. Overall Compliance Conclusion Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, pageWidth - 28, 24, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('4. Metrological Evaluation Determination & Conclusion', 18, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const conclusionLines = doc.splitTextToSize(report.overallConclusion, pageWidth - 36);
    doc.text(conclusionLines, 18, y + 12);

    y += 30;

    // Signatures Area
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    doc.text('Testing Engineer:', 18, y);
    doc.text('Technical Reviewer & Approver:', 110, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(evaluation.assignedEngineer.name, 18, y);
    doc.text(evaluation.assignedReviewer.name, 110, y);

    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Digital Sign ID: METRA-ENG-${evaluation.assignedEngineer.id}`, 18, y);
    doc.text(
      report.isSimulatedSignature
        ? `Digital Review Seal: ${report.signatureSignerName || 'Dr. Sunita Deshmukh'}`
        : 'Status: Pending Seal',
      110,
      y
    );

    // Footer on page 1
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `METRALAB (SIH 2026 - Black Squad) | Page 1 of 1 | Standard: ${report.regulatoryStandard}`,
      pageWidth / 2,
      287,
      { align: 'center' }
    );

    // Trigger vector download
    doc.save(`${report.reportNumber}_OIML_R76_TestReport.pdf`);
  }

  /**
   * Generates a genuine editable Microsoft Word (.docx) document
   */
  static async generateDocxReport(
    report: TestReport,
    evaluation: Evaluation,
    settings: LaboratorySettings
  ): Promise<void> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: settings.laboratoryName.toUpperCase(),
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${settings.addressLine1}, ${settings.cityStatePincode}`,
                  size: 18,
                  color: '64748b',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Accreditation: ${settings.accreditationNumber} | ISO/IEC 17025 Accredited Laboratory`,
                  size: 18,
                  bold: true,
                  color: '0369a1',
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '*** NOTICE: SAMPLE METROLOGICAL TEST REPORT — DEMO FORMAT AS PER OIML R 76-2 ***',
                  bold: true,
                  size: 18,
                  color: 'b45309',
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: 'PATTERN EVALUATION TEST REPORT',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Report Number: ${report.reportNumber} (Revision ${report.version}) | Date: ${new Date(
                    report.generatedAt
                  ).toLocaleDateString()}`,
                  size: 20,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Regulatory Reference: ${report.regulatoryStandard}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '1. Administrative & Technical Specifications',
              heading: HeadingLevel.HEADING_3,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation ID', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.evaluationNumber)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Evaluation Type', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph('Type Evaluation (Model Approval)')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Manufacturer', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.manufacturerSnapshot.name)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'License / Ref', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.manufacturerSnapshot.licenseNumber || 'N/A')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Model Designation', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.instrumentSnapshot.modelDesignation)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Serial Number', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.instrumentSnapshot.serialNumber)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Accuracy Class', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`Class ${evaluation.instrumentSnapshot.accuracyClass}`)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Instrument Type', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(evaluation.instrumentSnapshot.type.replace(/_/g, ' '))] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Max Capacity (Max)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${evaluation.instrumentSnapshot.maxCapacity} ${evaluation.instrumentSnapshot.measurementUnit}`)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Min Capacity (Min)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${evaluation.instrumentSnapshot.minCapacity} ${evaluation.instrumentSnapshot.measurementUnit}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Verification Interval (e)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${evaluation.instrumentSnapshot.verificationInterval} ${evaluation.instrumentSnapshot.measurementUnit}`)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Scale Interval (d)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${evaluation.instrumentSnapshot.scaleInterval} ${evaluation.instrumentSnapshot.measurementUnit}`)] }),
                  ],
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Environmental Conditions & Standard Weights Reference',
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `• Temperature: ${evaluation.laboratoryConditions.ambientTempStart}°C to ${evaluation.laboratoryConditions.ambientTempEnd}°C\n` +
                    `• Relative Humidity: ${evaluation.laboratoryConditions.relativeHumidityStart}% to ${evaluation.laboratoryConditions.relativeHumidityEnd}%\n` +
                    `• Reference Standard Weights: ${evaluation.laboratoryConditions.weightsSetReference} (Class ${evaluation.laboratoryConditions.weightsClass})\n` +
                    `• Calibration Certificate: ${evaluation.laboratoryConditions.weightsCalibrationCertNo} (Valid up to ${evaluation.laboratoryConditions.weightsCertExpiryDate})\n` +
                    `• Local Gravity: ${evaluation.laboratoryConditions.localGravityMs2} m/s²`,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              text: '3. Metrological Evaluation Determination',
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Final Conclusion: ${report.overallConclusion}`,
                  bold: true,
                  size: 22,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Testing Officer: ${evaluation.assignedEngineer.name} (${evaluation.assignedEngineer.email})\n` +
                    `Technical Reviewer: ${evaluation.assignedReviewer.name} (${evaluation.assignedReviewer.email})\n` +
                    `Approval Signature: ${report.isSimulatedSignature ? report.signatureSignerName : 'Pending'}`,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${report.reportNumber}_OIML_R76_TestReport.docx`);
  }
}
