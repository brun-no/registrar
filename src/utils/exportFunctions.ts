import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const [date, time] = dateString.split('\n');
  return `${date}\n${time}`;
};

export const savePDF = (records: any[]) => {
  // Create PDF in landscape orientation
  const doc = new jsPDF('landscape');
  
  // Title with dark blue background
  doc.setFillColor(0, 51, 153);
  doc.rect(10, 10, 277, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('Relatório de Etiquetas', 14, 17);
  
  const currentDate = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${currentDate}`, 200, 17);
  
  // Reset colors for table content
  doc.setTextColor(0, 0, 0);
  
  const tableColumn = [
    "ID",
    "Data\ne Hora",
    "Código\nda Peça",
    "Lote",
    "Total de\nPeças",
    "Peças por\nEmbalagem",
    "Embalagem\np/Palete",
    "Peças\nExtras",
    "Etiquetas\nNecessárias",
    "Etiquetas\nUsadas",
    "Observações"
  ];
  
  const tableRows = records.map(record => [
    record.id,
    record.dateCreated,
    record.partCode,
    record.batchNumber,
    record.totalPieces,
    record.piecesPerPackage,
    record.packagesPerPallet,
    record.extraPieces,
    record.totalLabels,
    record.usedLabels,
    record.notes
  ]);
  
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      minCellHeight: 8,
      valign: 'middle',
      halign: 'center'
    },
    headStyles: {
      fillColor: [0, 0, 128],
      textColor: [255, 255, 255],
      fontSize: 9,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
      8: { cellWidth: 25 },
      9: { cellWidth: 25 },
      10: { cellWidth: 'auto' }
    },
    bodyStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: 10, right: 10 }
  });
  
  doc.save(`Relatorio_Etiquetas_${currentDate.replace(/\//g, '-')}.pdf`);
};

export const saveXLSX = (records: any[]) => {
  const excelData = records.map(record => ({
    'ID': record.id,
    'Data e Hora': record.dateCreated,
    'Código da Peça': record.partCode,
    'Lote': record.batchNumber,
    'Total de Peças': record.totalPieces,
    'Peças por Embalagem': record.piecesPerPackage,
    'Embalagem por Palete': record.packagesPerPallet,
    'Peças Extras': record.extraPieces,
    'Etiquetas Necessárias': record.totalLabels,
    'Etiquetas Usadas': record.usedLabels,
    'Observações': record.notes
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Etiquetas');
  
  const wscols = [
    { wch: 8 },  // ID
    { wch: 20 }, // Data e Hora
    { wch: 15 }, // Código da Peça
    { wch: 15 }, // Lote
    { wch: 12 }, // Total de Peças
    { wch: 18 }, // Peças por Embalagem
    { wch: 18 }, // Embalagem por Palete
    { wch: 12 }, // Peças Extras
    { wch: 18 }, // Etiquetas Necessárias
    { wch: 15 }, // Etiquetas Usadas
    { wch: 30 }  // Observações
  ];
  worksheet['!cols'] = wscols;
  
  const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  XLSX.writeFile(workbook, `Relatorio_Etiquetas_${currentDate}.xlsx`);
};

export const saveCSV = (records: any[]) => {
  const csvData = records.map(record => ({
    'ID': record.id,
    'Data e Hora': record.dateCreated,
    'Código da Peça': record.partCode,
    'Lote': record.batchNumber,
    'Total de Peças': record.totalPieces,
    'Peças por Embalagem': record.piecesPerPackage,
    'Embalagem por Palete': record.packagesPerPallet,
    'Peças Extras': record.extraPieces,
    'Etiquetas Necessárias': record.totalLabels,
    'Etiquetas Usadas': record.usedLabels,
    'Observações': record.notes
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  
  link.href = URL.createObjectURL(blob);
  link.download = `Relatorio_Etiquetas_${currentDate}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};