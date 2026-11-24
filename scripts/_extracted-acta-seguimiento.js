// Copia extreta de generarActaSeguimiento() i les seves dependencies (src/App.jsx) per
// provar-la de veritat amb Node + jsPDF, sense tocar l'original. Vegeu
// .claude/skills/probar-pdf-acta/SKILL.md (adaptat aquí per a l'Acta de seguimiento).

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtShort = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—';

const ISO_DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
function quitarAcentos(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function fmtLimiteSeg(v) { return !v ? '—' : ISO_DATE_RX.test(v) ? fmtDate(v) : v; }
function nuevoNumSeguimiento(n) { return 'P-' + String(n).padStart(3, '0'); }
function tituloPuntoSeg(p) {
  if (p.titulo) return p.titulo;
  const t = p.texto || '';
  if (t.length <= 80) return t;
  const corte = t.lastIndexOf(' ', 80);
  return t.slice(0, corte > 0 ? corte : 80) + '…';
}
function hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

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

// Logo Plaat comprimit (PNG escala de grisos, 515×152px, ~10KB) — mateixa constant que
// src/App.jsx (PLAAT_LOGO_B64), copiada aquí perquè l'arnès no importa el fitxer sencer.
const PLAAT_LOGO_B64 = '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';

export async function generarActaSeguimiento(obra, reunion, puntos, anexo = []) {
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
  const CW = W - 2 * M;
  let y = M;

  function checkPage(alturaNecesaria) {
    if (y + alturaNecesaria > H - M) { doc.addPage(); y = M; }
  }

  // ── Cabecera: nombre de obra + logos (mismo ajuste de caja que generarActaVO_v2, sin
  // tocar PLAAT_LOGO_B64/logoClienteB64 — solo se reutilizan) ──────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(obra.nombre || '', M, y + 4);
  if (obra.emplazamiento) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(obra.emplazamiento.toUpperCase(), M, y + 8); }
  const promotor = (obra.propiedad || obra.cliente || '').toUpperCase();
  if (promotor) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(promotor, M, y + 11.5); }

  const logoH = 11, logoW = logoH * (515 / 152);
  const xLogoPlaat = W - M - logoW;
  try { doc.addImage(PLAAT_LOGO_B64, 'PNG', xLogoPlaat, y + 0.5, logoW, logoH); }
  catch (e) { doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Plaat.', W - M, y + 8, { align: 'right' }); }
  if (obra.logoClienteB64) {
    try {
      const propsCli = doc.getImageProperties(obra.logoClienteB64);
      const boxW = 26, gap = 6;
      let w2 = boxW, h2 = boxW * (propsCli.height / propsCli.width);
      if (h2 > logoH) { h2 = logoH; w2 = logoH * (propsCli.width / propsCli.height); }
      doc.addImage(obra.logoClienteB64, 'PNG', xLogoPlaat - gap - w2, y + 0.5 + (logoH - h2) / 2, w2, h2);
    } catch (e) { /* logo guardado ilegible: se omite sin romper el resto del PDF */ }
  }
  y += 15;
  doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0);
  doc.text('ACTA DE SEGUIMIENTO', M, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${fmtDate(reunion.fecha)} · ${reunion.titulo || reunion.tematica} · ${reunion.modalidad === 'video' ? 'Videollamada' : (reunion.lugar || 'Presencial')}`, M, y);
  y += 8;

  // ── Tabla de asistentes con bordes reales ──────────────────────────────────────────
  if (reunion.asistentes?.length) {
    const cE = CW * 0.32, cP = CW * 0.4, rowH = 6;
    function filaAsist(empresa, persona, rol, cab) {
      checkPage(rowH);
      doc.setDrawColor(0); doc.setLineWidth(0.2);
      if (cab) { doc.setFillColor(230, 230, 225); doc.rect(M, y, CW, rowH, 'FD'); } else doc.rect(M, y, CW, rowH);
      doc.line(M + cE, y, M + cE, y + rowH); doc.line(M + cE + cP, y, M + cE + cP, y + rowH);
      doc.setFont('helvetica', cab ? 'bold' : 'normal'); doc.setFontSize(8);
      doc.text(String(empresa || ''), M + 2, y + rowH / 2 + 1.2);
      doc.text(String(persona || ''), M + cE + 2, y + rowH / 2 + 1.2);
      doc.text(String(rol || ''), M + cE + cP + 2, y + rowH / 2 + 1.2);
      y += rowH;
    }
    filaAsist('Empresa', 'Nombre', 'Rol', true);
    reunion.asistentes.forEach(a => filaAsist(a.empresa, a.persona, a.rol, false));
    y += 6;
  }

  // ── Bloque de un punto: num/título/estado + meta + motivo + observaciones + fotos,
  // con borde real alrededor (reemplaza el texto suelto de antes) ───────────────────
  function dibujarPunto(p) {
    const info = ESTADOS_SEG_INFO[p.estado] || ESTADOS_SEG_INFO.curso;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const lineasMotivo = doc.splitTextToSize(p.texto || '', CW - 6);
    const comentariosRecientes = (p.comentarios || []).slice(-3);
    doc.setFontSize(8);
    const lineasObs = comentariosRecientes.flatMap(c => doc.splitTextToSize(`${fmtShort(c.creadaEn)}: ${c.texto}`, CW - 8));
    const fotos = p.fotos || [];
    const fW = (CW - 10) / 2;
    const fotoRows = [];
    for (let i = 0; i < fotos.length; i += 2) {
      const pair = [fotos[i], fotos[i + 1]].filter(Boolean);
      const dims = pair.map(f => { try { const pr = doc.getImageProperties(f.url || f.data); const r = pr.height / pr.width; const h = Math.min(fW * r, 42); return { w: h / r, h }; } catch (e) { return { w: fW, h: 30 }; } });
      fotoRows.push({ pair, dims, rh: Math.max(...dims.map(d => d.h)) });
    }
    const hCabecera = 9, hMotivo = lineasMotivo.length * 4.2 + 2, hObs = lineasObs.length ? lineasObs.length * 3.6 + 3 : 0;
    const hFotos = fotoRows.reduce((a, r) => a + r.rh + 2, 0);
    const alturaTotal = hCabecera + hMotivo + hObs + hFotos + 3;
    checkPage(alturaTotal);

    doc.setDrawColor(0); doc.setLineWidth(0.2); doc.rect(M, y, CW, alturaTotal);
    doc.setFillColor(245, 244, 240); doc.rect(M, y, CW, hCabecera, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0);
    doc.text(`${nuevoNumSeguimiento(p.num)} — ${tituloPuntoSeg(p)}`, M + 2, y + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(90);
    doc.text(`${p.responsable || '—'} · ${p.tematica || '—'} · Límite: ${fmtLimiteSeg(p.fechaLimite)}${p.fechaResolucion ? ' · Resuelto: ' + fmtDate(p.fechaResolucion) : ''}`, M + 2, y + 7.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...hexToRgb(info.color));
    doc.text(info.label.toUpperCase(), M + CW - 2, y + 5.5, { align: 'right' });
    doc.setTextColor(0);
    let yy = y + hCabecera + 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    dibuixarLiniesJustificades(doc, lineasMotivo, M + 3, yy, 4.2, CW - 6);
    yy += hMotivo;
    if (lineasObs.length) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(100);
      lineasObs.forEach(l => { doc.text(l, M + 4, yy); yy += 3.6; });
      doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      yy += 2;
    }
    fotoRows.forEach(row => {
      row.pair.forEach((f, pi) => { const src = f.url || f.data; if (src) try { doc.addImage(src, 'JPEG', M + 3 + pi * (fW + 4), yy, row.dims[pi].w, row.dims[pi].h); } catch (e) {} });
      yy += row.rh + 2;
    });
    y += alturaTotal + 3;
  }

  checkPage(8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('Temas tratados', M, y); y += 6;
  if (!puntos.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('Sin temas tratados en esta reunión.', M, y); y += 6; }
  puntos.forEach(dibujarPunto);

  if (anexo.length) {
    y += 2; checkPage(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`Anexo — pendientes de temática "${reunion.tematica}"`, M, y); y += 6;
    anexo.forEach(dibujarPunto);
  }

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
}
