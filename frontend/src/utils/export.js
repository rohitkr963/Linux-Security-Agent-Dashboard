// CSV Export
export const exportCSV = (filename, headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatRelativeTime } from './time';

export const exportDashboardPDF = (stats, trendData = []) => {
  const doc = new (jsPDF)();
  
  doc.setFontSize(20);
  doc.text('Linux Security Dashboard Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  // Summary
  doc.autoTable({
    startY: 40,
    head: [['Metrics', 'Count']],
    body: [
      ['Total Endpoints', stats.totalHosts],
      ['Online', stats.onlineHosts],
      ['Stale', stats.staleHosts],
      ['Offline', stats.offlineHosts],
      ['Passed Controls', stats.passedChecks],
      ['Failed Controls', stats.failedChecks],
      ['Compliance Score', `${stats.compliancePercent}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }
  });

  // Recent Alerts
  if (stats.recentAlerts && stats.recentAlerts.length > 0) {
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Severity', 'Host', 'Alert', 'Time']],
      body: stats.recentAlerts.map(a => [
        a.severity,
        a.host,
        a.title,
        formatRelativeTime(a.time)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }
    });
  }

  doc.save(`dashboard_report_${Date.now()}.pdf`);
};

export const exportHostPDF = (hostname, hostMeta, complianceScore, cisResults) => {
  const doc = new (jsPDF)();
  
  doc.setFontSize(20);
  doc.text(`Endpoint Audit: ${hostname}`, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Last Scanned: ${hostMeta?.last_seen ? formatRelativeTime(hostMeta.last_seen) : 'Unknown'}`, 14, 36);
  doc.text(`Compliance Score: ${complianceScore}%`, 14, 42);

  doc.autoTable({
    startY: 50,
    head: [['Benchmark', 'Status', 'Risk', 'Remediation']],
    body: cisResults.map(c => [
      c.name,
      c.status,
      c.severity,
      c.recommendation
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 3: { cellWidth: 80 } }
  });

  doc.save(`audit_${hostname.replace(/\\s+/g, '_')}_${Date.now()}.pdf`);
};
