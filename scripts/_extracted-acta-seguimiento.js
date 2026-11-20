// Copia extreta de generarActaSeguimiento() i les seves dependencies (src/App.jsx) per
// provar-la de veritat amb Node + jsPDF, sense tocar l'original. Vegeu
// .claude/skills/probar-pdf-acta/SKILL.md (adaptat aquí per a l'Acta de seguimiento).

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ISO_DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
function quitarAcentos(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function fmtLimiteSeg(v) { return !v ? '—' : ISO_DATE_RX.test(v) ? fmtDate(v) : v; }
function nuevoNumSeguimiento(n) { return 'P-' + String(n).padStart(3, '0'); }

const ESTADOS_SEG_INFO = {
  curso:    { label: 'En curso',  bg: '#FEF3DB', color: '#7C4A00' },
  decidido: { label: 'Decidido',  bg: '#E9E6FB', color: '#4A3B8F' },
  cerrado:  { label: 'Cerrado',   bg: '#E8F5E0', color: '#2D5E10' },
};

function justificarLinia(doc, line, x, ty, totalWidth, isLast, opts = {}) {
  const trimmed = (line || '').trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (isLast || words.length <= 1 || !words.length) { doc.text(line, x, ty, opts); return; }

  const spaceW = doc.getTextWidth(' ');
  const MAX_WORD_EXTRA = spaceW * 0.5;
  const lineW = doc.getTextWidth(words.join(' '));
  const totalExtra = totalWidth - lineW;
  if (totalExtra <= 0.01) { doc.text(words.join(' '), x, ty, opts); return; }

  const numGaps = words.length - 1;
  const extraPerGap = Math.min(MAX_WORD_EXTRA, totalExtra / numGaps);

  let cx = x;
  words.forEach((w, wi) => {
    doc.text(w, cx, ty, opts);
    cx += doc.getTextWidth(w) + (wi < numGaps ? spaceW + extraPerGap : 0);
  });
}
function dibuixarLiniesJustificades(doc, lines, x, yStart, lineHeight, totalWidth, opts = {}) {
  lines.forEach((line, i) => {
    justificarLinia(doc, line, x, yStart + i * lineHeight, totalWidth, i === lines.length - 1, opts);
  });
}

export async function generarActaSeguimiento(obra, reunion, puntos) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = () => reject(new Error('No se pudo cargar jsPDF'));
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 15, W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  let y = M;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(obra.nombre || '', M, y); y += 6;
  if (obra.emplazamiento) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(obra.emplazamiento, M, y); y += 5; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('ACTA DE SEGUIMIENTO', M, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${fmtDate(reunion.fecha)} · ${reunion.titulo || reunion.tematica} · ${reunion.modalidad === 'video' ? 'Videollamada' : (reunion.lugar || 'Presencial')}`, M, y);
  y += 7;

  if (reunion.asistentes?.length) {
    doc.setFont('helvetica', 'bold'); doc.text('Asistentes:', M, y); y += 5;
    doc.setFont('helvetica', 'normal');
    reunion.asistentes.forEach(a => {
      doc.text(`· ${[a.empresa, a.persona, a.rol].filter(Boolean).join(' — ')}`, M + 2, y);
      y += 4.5;
    });
    y += 3;
  }

  doc.setFont('helvetica', 'bold'); doc.text('Temas tratados:', M, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  puntos.forEach(p => {
    if (y > H - M - 20) { doc.addPage(); y = M; }
    doc.setFont('helvetica', 'bold'); doc.text(`${nuevoNumSeguimiento(p.num)} — ${ESTADOS_SEG_INFO[p.estado]?.label || p.estado}`, M, y); y += 4.5;
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(p.texto, W - 2 * M);
    dibuixarLiniesJustificades(doc, lineas, M, y, 4.3, W - 2 * M);
    y += lineas.length * 4.3 + 1;
    doc.setFontSize(8); doc.setTextColor(110);
    doc.text(`Responsable: ${p.responsable || '—'} · Fecha: ${fmtDate(p.fechaAlta)} · Límite: ${fmtLimiteSeg(p.fechaLimite)}${p.fechaResolucion ? ' · Resuelto: ' + fmtDate(p.fechaResolucion) : ''}`, M, y);
    doc.setTextColor(0); doc.setFontSize(9);
    y += 7;
  });

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
}
