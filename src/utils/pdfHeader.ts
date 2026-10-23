import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import logoTightUrl from '../assets/logo-tight.png';
import type { FormResponse, InspectionForm, FormField } from '../stores/formulariosStore';
import { getForms } from '../stores/formulariosStore';

/**
 * Converte qualquer URL de imagem (import asset, data:image, blob:, http/https)
 * para um DataURL JPEG otimizado via Canvas, garantindo compatibilidade total com jsPDF.
 */
async function loadImageAsJpegDataUrl(
  src: string,
  maxWidth = 1000,
  bgColor = '#ffffff'
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!src || src === '#') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || img.width || 400;
        const natH = img.naturalHeight || img.height || 300;
        const scale = natW > maxWidth ? maxWidth / natW : 1;
        const w = Math.max(1, Math.round(natW * scale));
        const h = Math.max(1, Math.round(natH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({ dataUrl, width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Desenha o cabeçalho corporativo padrão da D&A Inspeções no topo da página atual do PDF.
 */
export const addSystemPDFHeader = async (
  doc: jsPDF,
  title: string,
  docCode?: string,
  docDate?: string
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Faixa superior institucional (Azul Marinho Corporativo + Azul D&A)
  doc.setFillColor(7, 29, 61); // #071d3d
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(0, 102, 204); // #0066cc
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Caixa de fundo do cabeçalho
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 226, 236);
  doc.setLineWidth(0.35);
  doc.roundedRect(12, 10, pageWidth - 24, 34, 2, 2, 'FD');

  // Logo D&A Inspeções à esquerda
  try {
    const logoImg = await loadImageAsJpegDataUrl(logoTightUrl, 400, '#f8fafc');
    if (logoImg) {
      const boxH = 26;
      const ratio = logoImg.width / logoImg.height;
      const boxW = Math.min(34, boxH * ratio);
      doc.addImage(logoImg.dataUrl, 'JPEG', 15, 14, boxW, boxH, undefined, 'FAST');
    }
  } catch (error) {
    console.error('Erro ao carregar a logo para o PDF:', error);
  }

  // Linha vertical separadora após a logo
  doc.setDrawColor(218, 226, 236);
  doc.line(52, 13, 52, 41);

  // Dados institucionais da empresa (centro)
  doc.setTextColor(7, 29, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('D&A INSPEÇÕES E FABRICAÇÃO LTDA', 56, 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 102, 204);
  doc.text(title.toUpperCase(), 56, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CNPJ: 23.157.980/0001-36   |   Tel: (31) 3564-5360   |   contato@deainspecoes.com.br', 56, 28.5);
  doc.text('Av. Raja Gabáglia, 2000, Torre 2 - Sala 210 - Estoril - Belo Horizonte/MG - CEP 30494-170', 56, 33.5);
  doc.text('Sistema Integrado de Gestão da Qualidade e Inspeções Técnicas', 56, 38.5);

  // Quadro de Controle Documental à direita (estilo ISO 9001)
  const rightBoxX = pageWidth - 54;
  doc.setDrawColor(218, 226, 236);
  doc.line(rightBoxX, 13, rightBoxX, 41);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CONTROLE DOCUMENTAL', rightBoxX + 3, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(7, 29, 61);
  doc.text(`DOC: ${docCode || 'REL-TEC'}`, rightBoxX + 3, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Data: ${docDate || format(new Date(), 'dd/MM/yyyy')}`, rightBoxX + 3, 28.5);
  doc.text('Revisão: 00', rightBoxX + 3, 33.5);

  doc.setFillColor(220, 252, 231);
  doc.roundedRect(rightBoxX + 3, 35.5, 34, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(21, 128, 61);
  doc.text('DOCUMENTO OFICIAL', rightBoxX + 20, 39, { align: 'center' });

  // Resetar cores padrão
  doc.setTextColor(30, 41, 59);

  return 50;
};

/**
 * Adiciona rodapé corporativo numerado em todas as páginas do documento PDF.
 */
export const addCorporatePDFFooters = (doc: jsPDF, docCode: string) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const emittedAt = format(new Date(), 'dd/MM/yyyy HH:mm');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Linha divisória do rodapé
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

    // Faixa fina inferior
    doc.setFillColor(7, 29, 61);
    doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('D&A Inspeções e Fabricação LTDA — Relatório Técnico Oficial', 12, pageHeight - 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Ref: ${docCode}  •  Emitido em ${emittedAt}`, 12, pageHeight - 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 29, 61);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 12, pageHeight - 7.5, { align: 'right' });
  }
};

/**
 * Desenha uma faixa de título de seção corporativa.
 */
function drawSectionHeader(doc: jsPDF, y: number, numberStr: string, title: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(7, 29, 61); // #071d3d
  doc.roundedRect(12, y, pageWidth - 24, 7.5, 1.2, 1.2, 'F');

  doc.setFillColor(0, 102, 204); // detalhe lateral azul
  doc.roundedRect(12, y, 10, 7.5, 1.2, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(numberStr, 17, y + 5.1, { align: 'center' });
  doc.text(title.toUpperCase(), 25, y + 5.1);

  doc.setTextColor(30, 41, 59);
  return y + 10.5;
}

function getFieldTypeLabel(type?: string): string {
  switch (type) {
    case 'text': return 'Texto Curto';
    case 'textarea': return 'Observação / Parágrafo';
    case 'number': return 'Medição / Numérico';
    case 'date': return 'Data';
    case 'radio': return 'Conformidade / Escolha';
    case 'checkbox': return 'Múltipla Seleção';
    case 'select': return 'Lista de Seleção';
    case 'photo': return 'Evidência Fotográfica';
    case 'video': return 'Registro em Vídeo';
    case 'file': return 'Documento / Anexo';
    default: return 'Item Verificado';
  }
}

/**
 * Determina o parecer geral da inspeção com base nas respostas do formulário.
 */
function evaluateOverallStatus(resp: FormResponse): {
  label: string;
  bgColor: [number, number, number];
  textColor: [number, number, number];
} {
  const values = Object.values(resp.answers || {}).map(v =>
    (Array.isArray(v) ? v.join(' ') : String(v ?? '')).toLowerCase()
  );
  const joined = values.join(' | ');

  if (joined.includes('reprovado') || joined.includes('não conforme') || joined.includes('nao conforme')) {
    return {
      label: 'NÃO CONFORME / COM PENDÊNCIAS',
      bgColor: [254, 226, 226],
      textColor: [185, 28, 28],
    };
  }
  if (joined.includes('ressalva')) {
    return {
      label: 'APROVADO COM RESSALVAS',
      bgColor: [254, 243, 199],
      textColor: [180, 83, 9],
    };
  }
  if (joined.includes('aprovado') || joined.includes('conforme')) {
    return {
      label: 'APROVADO / CONFORME',
      bgColor: [220, 252, 231],
      textColor: [21, 128, 61],
    };
  }
  return {
    label: 'INSPEÇÃO CONCLUÍDA / REGISTRADA',
    bgColor: [219, 234, 254],
    textColor: [29, 78, 216],
  };
}

/**
 * Gera e faz o download de um Relatório Técnico Corporativo em PDF completo
 * com base nas respostas e fotos do formulário preenchido pelo inspetor.
 */
export async function generateCorporateFormResponsePDF(
  resp: FormResponse,
  explicitFormDef?: InspectionForm
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const docCode = `REL-${resp.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
  const submittedDate = new Date(resp.submittedAt);
  const dateFormatted = format(submittedDate, 'dd/MM/yyyy');
  const dateTimeFormatted = format(submittedDate, 'dd/MM/yyyy HH:mm');

  // Localizar definição completa do formulário para garantir todos os campos na ordem correta
  const formDef = explicitFormDef || getForms().find(f => f.id === resp.formId);
  const fields: FormField[] = resp.fieldsSnapshot && resp.fieldsSnapshot.length > 0
    ? resp.fieldsSnapshot
    : formDef?.fields || [];

  const fieldMap = new Map<string, FormField>();
  fields.forEach(f => fieldMap.set(f.id, f));

  // 1. Cabeçalho Corporativo
  let curY = await addSystemPDFHeader(
    doc,
    'Relatório Técnico de Inspeção e Diligenciamento',
    docCode,
    dateFormatted
  );

  // 2. Seção 01 — Identificação do Relatório e Rastreabilidade
  curY = drawSectionHeader(doc, curY, '01', 'Identificação da Inspeção e Rastreabilidade');

  const statusInfo = evaluateOverallStatus(resp);
  const totalAttachments = (resp.attachments || []).length;
  const totalPhotos = (resp.attachments || []).filter(a => a.type === 'photo').length;

  autoTable(doc, {
    startY: curY,
    margin: { left: 12, right: 12 },
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      lineColor: [218, 226, 236],
      lineWidth: 0.25,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38, textColor: [51, 65, 85] },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38, textColor: [51, 65, 85] },
      3: { cellWidth: 'auto' },
    },
    body: [
      [
        'Formulário Técnico:',
        { content: resp.formName, styles: { fontStyle: 'bold', textColor: [7, 29, 61] } },
        'Código do Relatório:',
        { content: docCode, styles: { fontStyle: 'bold', textColor: [0, 102, 204] } },
      ],
      [
        'Pasta / Categoria:',
        resp.category || formDef?.category || 'Inspeção Técnica',
        'Data / Hora de Envio:',
        dateTimeFormatted,
      ],
      [
        'Inspetor Responsável:',
        { content: resp.inspectorName, styles: { fontStyle: 'bold' } },
        'Evidências Anexadas:',
        `${totalPhotos} foto(s) / ${totalAttachments} arquivo(s) no total`,
      ],
      [
        'Descrição / Escopo:',
        {
          content: formDef?.description || 'Verificação técnica em campo conforme procedimento padrão D&A Inspeções.',
          colSpan: 3,
        },
      ],
      [
        'Parecer / Status Geral:',
        {
          content: statusInfo.label,
          colSpan: 3,
          styles: {
            fontStyle: 'bold',
            fillColor: statusInfo.bgColor,
            textColor: statusInfo.textColor,
          },
        },
      ],
    ],
  });

  curY = ((doc as any).lastAutoTable?.finalY || curY + 35) + 7;

  // 3. Seção 02 — Questionário Técnico e Respostas Registradas
  curY = drawSectionHeader(doc, curY, '02', 'Itens Verificados e Respostas do Formulário');

  // Construir linhas para TODOS os campos do formulário (na ordem original do formulário)
  const checklistRows: any[] = [];
  const processedFieldIds = new Set<string>();
  let itemCounter = 1;

  for (const field of fields) {
    processedFieldIds.add(field.id);
    const rawAns = resp.answers ? resp.answers[field.id] : undefined;
    const fieldAtts = (resp.attachments || []).filter(a => a.fieldId === field.id);

    let answerText = '';
    if (field.type === 'photo' || field.type === 'video' || field.type === 'file') {
      if (fieldAtts.length > 0) {
        const names = fieldAtts.map(a => a.name).join(', ');
        answerText = `${fieldAtts.length} arquivo(s) anexado(s): ${names}`;
      } else if (rawAns !== undefined && rawAns !== '') {
        answerText = Array.isArray(rawAns) ? rawAns.join(', ') : String(rawAns);
      } else {
        answerText = 'Nenhum anexo registrado';
      }
    } else {
      if (Array.isArray(rawAns)) {
        answerText = rawAns.length > 0 ? rawAns.join(', ') : 'Não preenchido';
      } else if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
        answerText = String(rawAns);
      } else {
        answerText = 'Não preenchido';
      }
    }

    checklistRows.push({
      index: String(itemCounter++).padStart(2, '0'),
      label: field.label || `Campo ${itemCounter}`,
      typeLabel: getFieldTypeLabel(field.type) + (field.required ? ' *' : ''),
      answer: answerText,
    });
  }

  // Caso haja respostas cujos IDs não estavam no snapshot
  Object.entries(resp.answers || {}).forEach(([fieldId, rawAns]) => {
    if (processedFieldIds.has(fieldId)) return;
    const answerText = Array.isArray(rawAns) ? rawAns.join(', ') : String(rawAns ?? '—');
    checklistRows.push({
      index: String(itemCounter++).padStart(2, '0'),
      label: fieldId,
      typeLabel: 'Item Adicional',
      answer: answerText,
    });
  });

  if (checklistRows.length === 0) {
    checklistRows.push({
      index: '01',
      label: 'Registro Geral de Inspeção',
      typeLabel: 'Status',
      answer: 'Formulário validado e enviado pelo inspetor em campo.',
    });
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: 12, right: 12, bottom: 20 },
    theme: 'grid',
    head: [['ITEM', 'PERGUNTA / REQUISITO DO FORMULÁRIO', 'TIPO DE CAMPO', 'RESPOSTA / REGISTRO DE CAMPO']],
    body: checklistRows.map(r => [r.index, r.label, r.typeLabel, r.answer]),
    headStyles: {
      fillColor: [15, 44, 89],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.2,
      lineColor: [218, 226, 236],
      lineWidth: 0.25,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 13, halign: 'center', fontStyle: 'bold', textColor: [0, 102, 204] },
      1: { cellWidth: 68, fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { cellWidth: 35, fontSize: 7.5, textColor: [100, 116, 139] },
      3: { cellWidth: 'auto', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw || '').toLowerCase();
        if (val === 'conforme' || val === 'aprovado') {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (val.includes('não conforme') || val.includes('nao conforme') || val.includes('reprovado')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (val.includes('ressalva')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fillColor = [255, 251, 235];
        } else if (val === 'não preenchido') {
          data.cell.styles.textColor = [148, 163, 184];
          data.cell.styles.fontStyle = 'italic';
        }
      }
    },
  });

  curY = ((doc as any).lastAutoTable?.finalY || curY + 30) + 8;

  // 4. Seção 03 — Relatório Fotográfico e Evidências de Campo
  const allAttachments = resp.attachments || [];
  const photoAtts = allAttachments.filter(a => a.type === 'photo');
  const otherAtts = allAttachments.filter(a => a.type !== 'photo');

  if (photoAtts.length > 0) {
    // Pré-carregar todas as imagens convertidas para JPEG DataURL
    const loadedPhotos: {
      att: typeof photoAtts[0];
      fieldLabel: string;
      imgData: { dataUrl: string; width: number; height: number } | null;
    }[] = [];

    for (const att of photoAtts) {
      const f = fieldMap.get(att.fieldId);
      const fieldLabel = f?.label || 'Evidência Fotográfica';
      const imgData = await loadImageAsJpegDataUrl(att.url, 900, '#ffffff');
      loadedPhotos.push({ att, fieldLabel, imgData });
    }

    // Verificar espaço na página antes do cabeçalho da seção de fotos
    if (curY + 82 > pageHeight - 20) {
      doc.addPage();
      curY = await addSystemPDFHeader(
        doc,
        'Relatório Técnico de Inspeção — Anexo Fotográfico',
        docCode,
        dateFormatted
      );
    }

    curY = drawSectionHeader(
      doc,
      curY,
      '03',
      `Relatório Fotográfico de Evidências (${loadedPhotos.length} Foto${loadedPhotos.length > 1 ? 's' : ''})`
    );

    // Grade de 2 colunas de fotos em molduras técnicas corporativas
    const cardW = (pageWidth - 24 - 6) / 2; // 89mm cada card
    const cardH = 72; // altura total do card de foto
    const imgBoxH = 52;

    for (let i = 0; i < loadedPhotos.length; i += 2) {
      if (curY + cardH + 4 > pageHeight - 20) {
        doc.addPage();
        curY = await addSystemPDFHeader(
          doc,
          'Relatório Técnico de Inspeção — Anexo Fotográfico',
          docCode,
          dateFormatted
        );
      }

      const pair = loadedPhotos.slice(i, i + 2);
      pair.forEach((item, colIdx) => {
        const cardX = 12 + colIdx * (cardW + 6);
        const figNum = String(i + colIdx + 1).padStart(2, '0');

        // Moldura externa do Card Fotográfico
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.35);
        doc.roundedRect(cardX, curY, cardW, cardH, 1.5, 1.5, 'FD');

        // Faixa de topo da moldura (identificação da Figura e Pergunta)
        doc.setFillColor(241, 245, 249);
        doc.rect(cardX + 0.3, curY + 0.3, cardW - 0.6, 7.5, 'F');
        doc.setDrawColor(218, 226, 236);
        doc.line(cardX, curY + 7.8, cardX + cardW, curY + 7.8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(0, 102, 204);
        doc.text(`FOTO ${figNum}`, cardX + 2.5, curY + 5.1);

        doc.setTextColor(30, 41, 59);
        const maxTitleLen = 36;
        const cleanTitle = item.fieldLabel.length > maxTitleLen
          ? item.fieldLabel.slice(0, maxTitleLen - 1) + '…'
          : item.fieldLabel;
        doc.text(`— ${cleanTitle}`, cardX + 16, curY + 5.1);

        // Área da Imagem
        const imgAreaX = cardX + 2.5;
        const imgAreaY = curY + 9.5;
        const imgAreaW = cardW - 5;
        const imgAreaH = imgBoxH - 2;

        if (item.imgData) {
          const ratio = item.imgData.width / item.imgData.height;
          let drawW = imgAreaW;
          let drawH = drawW / ratio;
          if (drawH > imgAreaH) {
            drawH = imgAreaH;
            drawW = drawH * ratio;
          }
          const offsetX = imgAreaX + (imgAreaW - drawW) / 2;
          const offsetY = imgAreaY + (imgAreaH - drawH) / 2;

          doc.addImage(item.imgData.dataUrl, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
        } else {
          doc.setFillColor(248, 250, 252);
          doc.rect(imgAreaX, imgAreaY, imgAreaW, imgAreaH, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text('Evidência registrada: ' + item.att.name, cardX + cardW / 2, imgAreaY + imgAreaH / 2, {
            align: 'center',
          });
        }

        // Rodapé da moldura fotográfica (Legenda Técnica)
        doc.setDrawColor(226, 232, 240);
        doc.line(cardX, curY + cardH - 10, cardX + cardW, curY + cardH - 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(51, 65, 85);
        const shortFile = item.att.name.length > 42 ? item.att.name.slice(0, 40) + '…' : item.att.name;
        doc.text(`Arquivo: ${shortFile}`, cardX + 2.5, curY + cardH - 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Verificado por: ${resp.inspectorName}  •  ${dateTimeFormatted}`, cardX + 2.5, curY + cardH - 2.3);
      });

      curY += cardH + 5;
    }
  }

  // Caso existam vídeos ou documentos complementares anexados
  if (otherAtts.length > 0) {
    if (curY + 35 > pageHeight - 20) {
      doc.addPage();
      curY = await addSystemPDFHeader(doc, 'Relatório Técnico de Inspeção — Anexos', docCode, dateFormatted);
    }

    autoTable(doc, {
      startY: curY,
      margin: { left: 12, right: 12 },
      theme: 'grid',
      head: [['TIPO DE MÍDIA', 'CAMPO DO FORMULÁRIO', 'NOME DO ARQUIVO REGISTRADO']],
      body: otherAtts.map(a => [
        a.type === 'video' ? 'Vídeo de Inspeção' : 'Documento Técnico',
        fieldMap.get(a.fieldId)?.label || 'Anexo Complementar',
        a.name,
      ]),
      headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    curY = ((doc as any).lastAutoTable?.finalY || curY + 20) + 8;
  }

  // 5. Seção 04 — Termo de Validação Técnica e Assinaturas Corporativas
  const validationSectionNum = photoAtts.length > 0 ? '04' : '03';
  if (curY + 52 > pageHeight - 18) {
    doc.addPage();
    curY = await addSystemPDFHeader(
      doc,
      'Relatório Técnico de Inspeção — Validação e Assinaturas',
      docCode,
      dateFormatted
    );
  }

  curY = drawSectionHeader(doc, curY, validationSectionNum, 'Termo de Validação Técnica e Assinaturas');

  // Caixa de declaração e assinaturas
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(12, curY, pageWidth - 24, 38, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    'Declaramos para os devidos fins de controle de qualidade e rastreabilidade que as informações, medições e evidências fotográficas constantes neste relatório foram coletadas e conferidas em campo conforme os procedimentos técnicos da D&A Inspeções e Fabricação LTDA.';
  const splitDec = doc.splitTextToSize(declarationText, pageWidth - 32);
  doc.text(splitDec, 16, curY + 5.5);

  // Blocos de assinatura lado a lado
  const sigY = curY + 25;
  const leftSigCenterX = 58;
  const rightSigCenterX = pageWidth - 58;

  // Assinatura manuscrita do inspetor (se desenhada no app) ou rubrica digital
  if (resp.inspectorSignature) {
    try {
      const sigImg = await loadImageAsJpegDataUrl(resp.inspectorSignature, 400, '#f8fafc');
      if (sigImg) {
        doc.addImage(sigImg.dataUrl, 'JPEG', leftSigCenterX - 22, sigY - 12.5, 44, 11.5, undefined, 'FAST');
      } else {
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(11);
        doc.setTextColor(15, 44, 89);
        doc.text(resp.inspectorName, leftSigCenterX, sigY - 2.5, { align: 'center' });
      }
    } catch {
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(11);
      doc.setTextColor(15, 44, 89);
      doc.text(resp.inspectorName, leftSigCenterX, sigY - 2.5, { align: 'center' });
    }
  } else {
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(11);
    doc.setTextColor(15, 44, 89);
    doc.text(resp.inspectorName, leftSigCenterX, sigY - 2.5, { align: 'center' });
  }

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.4);
  doc.line(22, sigY, 94, sigY);
  doc.line(pageWidth - 94, sigY, pageWidth - 22, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(resp.inspectorName.toUpperCase(), leftSigCenterX, sigY + 4.5, { align: 'center' });
  doc.text('COORDENAÇÃO TÉCNICA / QUALIDADE', rightSigCenterX, sigY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Inspetor Responsável • Assinado em ${dateTimeFormatted}`, leftSigCenterX, sigY + 8.5, { align: 'center' });
  doc.text('D&A Inspeções e Fabricação LTDA', rightSigCenterX, sigY + 8.5, { align: 'center' });

  // 6. Numerar todas as páginas e aplicar rodapé corporativo
  addCorporatePDFFooters(doc, docCode);

  const safeName = resp.formName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Relatorio_DA_${safeName}_${format(submittedDate, 'ddMMyyyy_HHmm')}.pdf`;

  await saveOrDownloadPDF(doc, fileName);
}

/**
 * Salva/baixa o PDF de forma compatível tanto com navegadores Web quanto com o APK Android Nativo.
 */
export async function saveOrDownloadPDF(doc: jsPDF, fileName: string): Promise<void> {
  const win = window as any;

  // 1. Se estiver dentro do APK Android com a ponte nativa AndroidPDFBridge
  if (win.AndroidPDFBridge && typeof win.AndroidPDFBridge.savePdfToDownloads === 'function') {
    const dataUri = doc.output('datauristring');
    const ok = win.AndroidPDFBridge.savePdfToDownloads(dataUri, fileName);
    if (ok) return;
  }

  // 2. Fallback para Web Share API em celulares caso não tenha a ponte nativa
  try {
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice && navigator.canShare) {
      const blob = doc.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Relatório Técnico Corporativo - D&A Inspeções',
        });
        return;
      }
    }
  } catch {
    // Se o usuário cancelar o share ou o navegador não suportar, segue para o download padrão
  }

  // 3. Download padrão no navegador (PC / Mobile Chrome)
  doc.save(fileName);
}
