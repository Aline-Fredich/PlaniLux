import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, ShadingType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Board, PrintSettings } from '../types';
import { timeToMinutes, computeDayCourseLayouts } from '../lib/courseLayout';

/**
 * Nettoie une couleur hex pour docx (retire le # et vérifie 6 caractères)
 */
const sanitizeHex = (color?: string, defaultColor = 'FFFFFF'): string => {
  if (!color) return defaultColor;
  const clean = color.replace('#', '').trim();
  if (clean.length === 3) {
    return clean.split('').map(c => c + c).join('').toUpperCase();
  }
  if (clean.length === 6) {
    return clean.toUpperCase();
  }
  return defaultColor;
};

/**
 * Export au format Microsoft Word (.docx) natif et éditable
 */
export const exportBoardToDocx = async (board: Board, settings: PrintSettings): Promise<Blob> => {
  const colAxes = board.axes
    .filter(a => a.axis === 'column')
    .sort((a, b) => a.position - b.position);
  const rowAxes = board.axes
    .filter(a => a.axis === 'row')
    .sort((a, b) => a.position - b.position);

  // Ligne d'en-tête (Coin supérieur gauche vide + en-têtes de colonnes)
  const headerCells: TableCell[] = [
    new TableCell({
      width: { size: 2000, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
      children: [
        new Paragraph({
          text: 'Horaire / Axe',
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 }
        })
      ]
    }),
    ...colAxes.map(col => new TableCell({
      width: { size: Math.max(1500, Math.floor(10000 / colAxes.length)), type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'E5E7EB' },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: col.label,
              bold: true,
              color: '111827'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 }
        })
      ]
    }))
  ];

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: settings.repeatHeaders,
      children: headerCells
    })
  ];

  // Lignes de contenu
  for (const r of rowAxes) {
    const rowCells: TableCell[] = [
      new TableCell({
        width: { size: 2000, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: r.label,
                bold: true,
                color: '374151'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 }
          })
        ]
      })
    ];

    for (const c of colAxes) {
      const cellData = board.cells.find(cell => cell.row_axis_id === r.id && cell.column_axis_id === c.id);
      const rawText = cellData?.content || '';
      const bgColor = settings.printColors ? sanitizeHex(cellData?.background_color, 'FFFFFF') : 'FFFFFF';
      const textColor = settings.printColors ? sanitizeHex(cellData?.text_color, '1F2937') : '1F2937';

      // Split des retours à la ligne
      const lines = rawText.split('\n');
      const paragraphs = lines.map(line => new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: cellData?.text_style?.bold ?? false,
            italics: cellData?.text_style?.italic ?? false,
            color: textColor
          })
        ],
        alignment: cellData?.text_style?.align === 'center' ? AlignmentType.CENTER :
                   cellData?.text_style?.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 60, after: 60 }
      }));

      rowCells.push(new TableCell({
        shading: { type: ShadingType.CLEAR, fill: bgColor },
        borders: settings.showBorders ? undefined : {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')]
      }));
    }

    tableRows.push(new TableRow({ children: rowCells }));
  }

  const docTable = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });

  const childrenNodes = [
    new Paragraph({
      children: [
        new TextRun({
          text: board.title,
          bold: true,
          size: 32,
          color: '1E3A8A'
        })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Généré le ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })} • Planilux`,
          italics: true,
          size: 18,
          color: '6B7280'
        })
      ],
      spacing: { after: 300 }
    }),
    docTable
  ];

  if (settings.includeNotes && board.settings.notes) {
    childrenNodes.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '\nNotes & Recommandations :',
            bold: true,
            size: 22,
            color: '374151'
          })
        ],
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: board.settings.notes,
            italics: true,
            size: 20,
            color: '4B5563'
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: settings.margins === 'compact' ? 720 : settings.margins === 'none' ? 360 : 1440,
            bottom: settings.margins === 'compact' ? 720 : settings.margins === 'none' ? 360 : 1440,
            left: settings.margins === 'compact' ? 720 : settings.margins === 'none' ? 360 : 1440,
            right: settings.margins === 'compact' ? 720 : settings.margins === 'none' ? 360 : 1440,
          }
        }
      },
      children: childrenNodes
    }]
  });

  return await Packer.toBlob(doc);
};

/**
 * Export au format PDF haute fidélité avec jsPDF
 */
export const exportBoardToPdf = (board: Board, settings: PrintSettings): Blob => {
  const isLandscape = settings.orientation === 'landscape';
  
  // Résolution personnalisée selon format cible
  let pdfFormat: string | [number, number] = 'a4';
  let pdfOrientation: 'portrait' | 'landscape' = isLandscape ? 'landscape' : 'portrait';

  if (settings.format === 'phone_wallpaper') {
    pdfFormat = [108, 192];
    pdfOrientation = 'portrait';
  } else if (settings.format === 'desktop_wallpaper') {
    pdfFormat = [192, 108];
    pdfOrientation = 'landscape';
  } else if (settings.format === 'tablet') {
    pdfFormat = isLandscape ? [267, 200] : [200, 267];
  } else if (settings.format === 'Letter') {
    pdfFormat = 'letter';
  } else {
    pdfFormat = 'a4';
  }

  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format: pdfFormat
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = settings.margins === 'compact' ? 6 : settings.margins === 'none' ? 3 : 12;
  let currentY = margin + 5;

  const scale = (settings.cellScale || 100) / 100;
  const tableScale = (settings.tableScaleOnly || 100) / 100;
  const fontScale = (settings.fontSizeScale || 100) / 100;

  // Titre
  if (settings.showTitle !== false) {
    const titleText = settings.customTitle || board.title;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(Math.max(8, Math.round(14 * scale * fontScale)));
    doc.setTextColor(30, 58, 138);
    doc.text(titleText, margin, currentY);
    currentY += Math.max(4, Math.round(5 * scale));
  }

  // Sous-titre ou date
  if (settings.showSubtitle !== false && settings.customSubtitle) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(Math.max(6, Math.round(8.5 * scale * fontScale)));
    doc.setTextColor(75, 85, 99);
    doc.text(settings.customSubtitle, margin, currentY);
    currentY += Math.max(3.5, Math.round(4.5 * scale));
  }

  if (settings.showDate !== false) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(Math.max(5.5, Math.round(7.5 * scale * fontScale)));
    doc.setTextColor(107, 114, 128);
    doc.text(`Document officiel imprimé le ${new Date().toLocaleDateString('fr-FR')} • Planilux`, margin, currentY);
    currentY += Math.max(4, Math.round(5.5 * scale));
  }

  const colAxes = board.axes.filter(a => a.axis === 'column').sort((a, b) => a.position - b.position);
  const availableWidth = pageWidth - (margin * 2);
  const showTime = settings.showTimeCol !== false;
  const timeColWidth = showTime ? Math.min(26, availableWidth * 0.14 * tableScale) : 0;
  const dataColWidth = (availableWidth - timeColWidth) / Math.max(1, colAxes.length);

  // Couleurs dynamiques
  const headerHex = (settings.headerBgColor || '#f1f5f9').replace('#', '');
  const headR = parseInt(headerHex.substring(0, 2), 16) || 241;
  const headG = parseInt(headerHex.substring(2, 4), 16) || 245;
  const headB = parseInt(headerHex.substring(4, 6), 16) || 249;

  const borderHex = (settings.borderColor || '#cbd5e1').replace('#', '');
  const bR = parseInt(borderHex.substring(0, 2), 16) || 203;
  const bG = parseInt(borderHex.substring(2, 4), 16) || 213;
  const bB = parseInt(borderHex.substring(4, 6), 16) || 225;

  // CAS 1 : GRILLE HORAIRE CONTINUE (08:00 - 19:00) SI EMPLOI DU TEMPS AVEC COURS
  if (board.template_type === 'timetable' || (board.courses && board.courses.length > 0)) {
    const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const headerHeight = Math.max(7, Math.round(9 * tableScale));
    const gridAvailableHeight = pageHeight - currentY - margin - (settings.includeNotes && board.settings.notes ? 18 : 6);
    const hourHeight = Math.max(8, Math.min(22, (gridAvailableHeight - headerHeight) / HOURS.length));
    const totalGridHeight = hourHeight * HOURS.length;

    // En-tête des colonnes
    if (showTime) {
      doc.setFillColor(headR, headG, headB);
      doc.rect(margin, currentY, timeColWidth, headerHeight, 'F');
      if (settings.showBorders) {
        doc.setDrawColor(bR, bG, bB);
        doc.rect(margin, currentY, timeColWidth, headerHeight, 'S');
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(Math.max(5, Math.round(7.5 * fontScale * tableScale)));
      doc.setTextColor(30, 41, 59);
      doc.text('HORAIRE', margin + (timeColWidth / 2), currentY + (headerHeight / 2) + 1.2, { align: 'center' });
    }

    colAxes.forEach((col, idx) => {
      const x = margin + timeColWidth + (idx * dataColWidth);
      doc.setFillColor(headR, headG, headB);
      doc.rect(x, currentY, dataColWidth, headerHeight, 'F');
      if (settings.showBorders) {
        doc.setDrawColor(bR, bG, bB);
        doc.rect(x, currentY, dataColWidth, headerHeight, 'S');
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(Math.max(5, Math.round(7.5 * fontScale * tableScale)));
      doc.setTextColor(17, 24, 39);
      doc.text(col.label, x + (dataColWidth / 2), currentY + (headerHeight / 2) + 1.2, { align: 'center' });
    });

    currentY += headerHeight;
    const gridStartY = currentY;

    // Colonne horaire à gauche
    if (showTime) {
      HOURS.forEach((h, i) => {
        const y = gridStartY + (i * hourHeight);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, timeColWidth, hourHeight, 'F');
        if (settings.showBorders) {
          doc.setDrawColor(bR, bG, bB);
          doc.rect(margin, y, timeColWidth, hourHeight, 'S');
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(Math.max(4.5, Math.round(6.5 * fontScale * tableScale)));
        doc.setTextColor(71, 85, 105);
        doc.text(`${h.toString().padStart(2, '0')}:00`, margin + (timeColWidth / 2), y + 3.5, { align: 'center' });
      });
    }

    // Fond de grille et lignes horaires
    colAxes.forEach((_, dayIdx) => {
      const colX = margin + timeColWidth + (dayIdx * dataColWidth);

      HOURS.forEach((_, i) => {
        const y = gridStartY + (i * hourHeight);
        doc.setFillColor(255, 255, 255);
        doc.rect(colX, y, dataColWidth, hourHeight, 'F');
        if (settings.showBorders) {
          doc.setDrawColor(bR, bG, bB);
          doc.rect(colX, y, dataColWidth, hourHeight, 'S');
        }
      });

      // Dessin des cours du jour
      const dayCourses = (board.courses || []).filter(c => c.dayIndex === dayIdx);
      const dayLayouts = computeDayCourseLayouts(dayCourses);

      dayCourses.forEach(course => {
        const startMin = timeToMinutes(course.startTime);
        const endMin = timeToMinutes(course.endTime);
        const topOffset = ((startMin - 480) / 60) * hourHeight;
        const cHeight = ((endMin - startMin) / 60) * hourHeight;

        const layout = dayLayouts.get(course.id) || { colIndex: 0, totalCols: 1, hasConflict: false };
        const subWidth = (dataColWidth - 2) / layout.totalCols;
        const subX = colX + 1 + (layout.colIndex * subWidth);

        // Couleur de la carte
        const hex = (course.color || '#4A90E2').replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 74;
        const g = parseInt(hex.substring(2, 4), 16) || 144;
        const b = parseInt(hex.substring(4, 6), 16) || 226;

        doc.setFillColor(r, g, b);
        doc.roundedRect(subX + 0.5, gridStartY + topOffset + 0.5, subWidth - 1, cHeight - 1, 1.5, 1.5, 'F');

        // Textes du cours en blanc pur
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(Math.max(4.5, Math.round(6.5 * fontScale * tableScale)));

        const titleText = doc.splitTextToSize(course.title, Math.max(8, subWidth - 3));
        doc.text(titleText.slice(0, 2), subX + 2, gridStartY + topOffset + 3.5);

        if (cHeight > 8) {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(Math.max(4, Math.round(5.5 * fontScale * tableScale)));
          if (course.room) {
            doc.text(`Salle: ${course.room}`, subX + 2, gridStartY + topOffset + cHeight - 2);
          }
        }
      });
    });

    currentY += totalGridHeight;
  } else {
    // CAS 2 : MATRICE CLASSIQUE PAR CELLULES
    const rowAxes = board.axes.filter(a => a.axis === 'row').sort((a, b) => a.position - b.position);
    const densityMultiplier = settings.density === 'compact' ? 0.65 : settings.density === 'spacious' ? 1.35 : 1.0;
    const baseCalculated = (pageHeight - currentY - margin - 15) / Math.max(1, rowAxes.length + 1);
    const rowHeight = Math.max(4.5, Math.min(30, baseCalculated * densityMultiplier * scale * tableScale));

    if (showTime) {
      doc.setFillColor(headR, headG, headB);
      doc.rect(margin, currentY, timeColWidth, rowHeight, 'F');
      if (settings.showBorders) {
        doc.setDrawColor(bR, bG, bB);
        doc.rect(margin, currentY, timeColWidth, rowHeight, 'S');
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(Math.max(5, Math.round(7.5 * fontScale * tableScale)));
      doc.setTextColor(30, 41, 59);
      doc.text('HORAIRE', margin + (timeColWidth / 2), currentY + (rowHeight / 2) + 1.5, { align: 'center' });
    }

    colAxes.forEach((col, idx) => {
      const x = margin + timeColWidth + (idx * dataColWidth);
      doc.setFillColor(headR, headG, headB);
      doc.rect(x, currentY, dataColWidth, rowHeight, 'F');
      if (settings.showBorders) {
        doc.setDrawColor(bR, bG, bB);
        doc.rect(x, currentY, dataColWidth, rowHeight, 'S');
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(Math.max(5, Math.round(7.5 * fontScale * tableScale)));
      doc.setTextColor(17, 24, 39);
      doc.text(col.label, x + (dataColWidth / 2), currentY + (rowHeight / 2) + 1.5, { align: 'center' });
    });

    currentY += rowHeight;

    rowAxes.forEach(row => {
      if (showTime) {
        doc.setFillColor(headR, headG, headB);
        doc.rect(margin, currentY, timeColWidth, rowHeight, 'F');
        if (settings.showBorders) {
          doc.setDrawColor(bR, bG, bB);
          doc.rect(margin, currentY, timeColWidth, rowHeight, 'S');
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(Math.max(4.5, Math.round(6.8 * fontScale * tableScale)));
        doc.setTextColor(55, 65, 81);
        const splitLabel = doc.splitTextToSize(row.label, Math.max(10, timeColWidth - 2));
        doc.text(splitLabel, margin + (timeColWidth / 2), currentY + (rowHeight / 2) + 1, { align: 'center' });
      }

      colAxes.forEach((col, colIdx) => {
        const x = margin + timeColWidth + (colIdx * dataColWidth);
        const cellData = board.cells.find(c => c.row_axis_id === row.id && c.column_axis_id === col.id);

        if (cellData && cellData.background_color && settings.printColors && cellData.background_color !== '#ffffff') {
          const hex = cellData.background_color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 255;
          const g = parseInt(hex.substring(2, 4), 16) || 255;
          const b = parseInt(hex.substring(4, 6), 16) || 255;
          doc.setFillColor(r, g, b);
          doc.rect(x, currentY, dataColWidth, rowHeight, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(x, currentY, dataColWidth, rowHeight, 'F');
        }

        if (settings.showBorders) {
          doc.setDrawColor(bR, bG, bB);
          doc.rect(x, currentY, dataColWidth, rowHeight, 'S');
        }

        if (cellData && cellData.content) {
          doc.setFont('Helvetica', cellData.text_style?.bold ? 'bold' : 'normal');
          doc.setFontSize(Math.max(4.5, Math.round(6.5 * fontScale * tableScale)));
          doc.setTextColor(31, 41, 55);
          const lines = doc.splitTextToSize(cellData.content, Math.max(8, dataColWidth - 2));
          const textY = currentY + (rowHeight > 10 ? 3.5 : 2.5);
          doc.text(lines.slice(0, 4), x + (dataColWidth / 2), textY, { align: 'center' });
        }
      });

      currentY += rowHeight;
    });
  }

  // Notes de bas de page si présentes
  if (settings.includeNotes && board.settings.notes && currentY < pageHeight - 15) {
    currentY += 5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text('Notes :', margin, currentY);
    currentY += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    const splitNotes = doc.splitTextToSize(board.settings.notes, availableWidth);
    doc.text(splitNotes, margin, currentY);
  }

  return doc.output('blob');
};

/**
 * Déclenche le téléchargement d'un Blob sous un nom de fichier propre
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Exporte un élément DOM sous forme d'image PNG haute fidélité
 */
export const exportElementToPng = async (element: HTMLElement, filename: string): Promise<void> => {
  const dataUrl = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.5,
    cacheBust: true
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
