import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import jsPDF from 'jspdf';
import { X, Save, Undo2, Eraser, PenLine, Hand, Download } from 'lucide-react';

GlobalWorkerOptions.workerSrc = PdfWorker;

const COLORS = ['#d93025', '#1a73e8', '#202124', '#188038', '#e37400', '#7b1fa2'];
const SIZES = [2, 4, 8];

export default function PdfAnnotator({ fileData, fileName, title, onClose, onSave }) {
  const containerRef = useRef(null);
  const pagesRef = useRef([]);
  const infoRef = useRef([]);
  const strokesRef = useRef({});
  const activePageRef = useRef(0);
  const drawingRef = useRef(false);
  const colorRef = useRef(COLORS[0]);
  const sizeRef = useRef(SIZES[1]);

  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState('pen');
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  const hasStrokes = Object.keys(strokesRef.current).some(k => strokesRef.current[k]?.length > 0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const meta = String(fileData || '').split(',');
        const b64 = meta.length > 1 ? meta.slice(1).join(',') : '';
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const pdf = await getDocument({ data: bytes }).promise;
        if (cancelled) return;

        setNumPages(pdf.numPages);
        const container = containerRef.current;
        container.innerHTML = '';
        pagesRef.current = [];
        infoRef.current = [];
        strokesRef.current = {};

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (cancelled) return;
          const vp1 = page.getViewport({ scale: 1 });
          const pw = vp1.width;
          const ph = vp1.height;
          const maxW = 920;
          const scale = Math.min(1.5, maxW / pw);
          const viewport = page.getViewport({ scale });
          const w = Math.ceil(viewport.width);
          const h = Math.ceil(viewport.height);

          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;margin:0 auto 16px;box-shadow:0 2px 12px rgba(0,0,0,0.25);background:#fff;';
          wrap.style.width = w + 'px';
          wrap.style.height = h + 'px';

          const pdfCanvas = document.createElement('canvas');
          pdfCanvas.width = w;
          pdfCanvas.height = h;
          wrap.appendChild(pdfCanvas);

          const overlay = document.createElement('canvas');
          overlay.width = w;
          overlay.height = h;
          overlay.style.cssText = 'position:absolute;top:0;left:0;cursor:crosshair;touch-action:none;';
          wrap.appendChild(overlay);

          const badge = document.createElement('div');
          badge.textContent = String(i);
          badge.style.cssText = 'position:absolute;top:6px;right:8px;z-index:3;background:rgba(0,0,0,0.55);color:#fff;font:600 11px/1 sans-serif;padding:2px 7px;border-radius:8px;pointer-events:none;';
          wrap.appendChild(badge);

          await page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport }).promise;

          const octx = overlay.getContext('2d');
          const idx = i - 1;
          pagesRef.current.push({ overlay, octx, w, h, pdfCanvas });
          infoRef.current.push({ pw, ph, viewport });
          strokesRef.current[idx] = [];

          const toPoint = (e) => {
            const rect = overlay.getBoundingClientRect();
            return {
              x: (e.clientX - rect.left) * (w / rect.width),
              y: (e.clientY - rect.top) * (h / rect.height),
            };
          };

          const onDown = (e) => {
            if (mode === 'pen') {
              e.preventDefault();
              overlay.setPointerCapture?.(e.pointerId);
              drawingRef.current = true;
              activePageRef.current = idx;
              setCurrentPage(idx + 1);
              const p = toPoint(e);
              strokesRef.current[idx].push([p]);
              drawOverlay(idx);
            }
          };
          const onMove = (e) => {
            if (!drawingRef.current || mode !== 'pen') return;
            const p = toPoint(e);
            const stroke = strokesRef.current[idx][strokesRef.current[idx].length - 1];
            stroke.push(p);
            drawSegment(octx, stroke, colorRef.current, sizeRef.current);
          };
          const onUp = (e) => {
            if (!drawingRef.current) return;
            drawingRef.current = false;
            setVersion(v => v + 1);
          };

          overlay.addEventListener('pointerdown', onDown);
          overlay.addEventListener('pointermove', onMove);
          overlay.addEventListener('pointerup', onUp);
          overlay.addEventListener('pointercancel', onUp);
          overlay.addEventListener('pointerleave', () => { if (drawingRef.current) { drawingRef.current = false; setVersion(v => v + 1); } });

          container.appendChild(wrap);
        }
        setLoading(false);
      } catch (e) {
        console.error('Error loading PDF for annotation:', e);
        setError('No se pudo cargar el PDF para anotar.');
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fileData]);

  const drawSegment = (ctx, stroke, col, wid) => {
    if (stroke.length < 2) {
      ctx.beginPath();
      ctx.arc(stroke[0].x, stroke[0].y, wid / 2, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      return;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = col;
    ctx.lineWidth = wid;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  };

  const drawOverlay = (idx) => {
    const { octx, w, h } = pagesRef.current[idx];
    octx.clearRect(0, 0, w, h);
    (strokesRef.current[idx] || []).forEach(stroke => drawSegment(octx, stroke, colorRef.current, sizeRef.current));
  };

  const handleUndo = () => {
    const idx = activePageRef.current;
    const arr = strokesRef.current[idx];
    if (arr && arr.length > 0) {
      arr.pop();
      drawOverlay(idx);
      setVersion(v => v + 1);
    }
  };

  const handleClearPage = () => {
    const idx = activePageRef.current;
    if (strokesRef.current[idx]) {
      strokesRef.current[idx] = [];
      drawOverlay(idx);
      setVersion(v => v + 1);
    }
  };

  const handleSave = async () => {
    if (!hasStrokes) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const pdf = new jsPDF({
        orientation: infoRef.current[0].pw > infoRef.current[0].ph ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [infoRef.current[0].pw, infoRef.current[0].ph],
        compress: true,
      });
      for (let i = 0; i < pagesRef.current.length; i++) {
        if (i > 0) {
          const info = infoRef.current[i];
          pdf.addPage([info.pw, info.ph], info.pw > info.ph ? 'landscape' : 'portrait');
        }
        const { pw, ph } = infoRef.current[i];
        const { pdfCanvas } = pagesRef.current[i];
        const combined = document.createElement('canvas');
        combined.width = pdfCanvas.width;
        combined.height = pdfCanvas.height;
        const c = combined.getContext('2d');
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, combined.width, combined.height);
        c.drawImage(pdfCanvas, 0, 0);
        (strokesRef.current[i] || []).forEach(stroke => drawSegment(c, stroke, colorRef.current, sizeRef.current));
        const img = combined.toDataURL('image/jpeg', 0.9);
        pdf.addImage(img, 'JPEG', 0, 0, pw, ph);
      }
      const dataUrl = pdf.output('datauristring');
      await onSave(dataUrl);
    } catch (e) {
      console.error('Error saving annotated PDF:', e);
      alert('Error al guardar el PDF anotado');
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileData;
    a.download = fileName || 'documento.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#202124', zIndex: 1200,
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        padding: '0.6rem 1rem', background: '#292a2d', color: '#e8eaed',
        borderBottom: '1px solid #3c4043',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginRight: '0.25rem' }}>{title || 'Anotar PDF'}</div>
        <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>{numPages > 0 ? `Página ${currentPage} / ${numPages}` : ''}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.5rem', background: '#3c4043', borderRadius: '8px', padding: '3px' }}>
          <button
            onClick={() => setMode('pen')}
            title="Lápiz"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: mode === 'pen' ? '#1a73e8' : 'transparent', color: mode === 'pen' ? '#fff' : '#c6c6c6' }}
          >
            <PenLine size={14} /> Lápiz
          </button>
          <button
            onClick={() => setMode('nav')}
            title="Navegar (permite hacer scroll)"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: mode === 'nav' ? '#1a73e8' : 'transparent', color: mode === 'nav' ? '#fff' : '#c6c6c6' }}
          >
            <Hand size={14} /> Navegar
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '0.5rem' }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { colorRef.current = c; setColor(c); }}
              style={{
                width: 22, height: 22, borderRadius: '50%', border: color === c ? '2px solid #fff' : '2px solid transparent',
                background: c, cursor: 'pointer', padding: 0
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '0.5rem' }}>
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => { sizeRef.current = s; setSize(s); }}
              title={`Grosor ${s}px`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '8px', border: size === s ? '2px solid #1a73e8' : '2px solid #3c4043', background: 'transparent', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ width: Math.min(s * 2, 14), height: Math.min(s * 2, 14), borderRadius: '50%', background: '#e8eaed', display: 'block' }} />
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleUndo}
          title="Deshacer último trazo"
          disabled={!hasStrokes}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: '#3c4043', color: hasStrokes ? '#e8eaed' : '#5f6368' }}
        >
          <Undo2 size={14} /> Deshacer
        </button>
        <button
          onClick={handleClearPage}
          title="Borrar anotaciones de esta página"
          disabled={!hasStrokes}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: '#3c4043', color: hasStrokes ? '#e8eaed' : '#5f6368' }}
        >
          <Eraser size={14} /> Borrar
        </button>
        <button
          onClick={handleDownload}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: '#3c4043', color: '#e8eaed' }}
        >
          <Download size={14} /> Original
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem', borderRadius: '8px', border: 'none', cursor: saving ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 700, background: '#1a73e8', color: '#fff' }}
        >
          <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: '#3c4043', color: '#e8eaed' }}
        >
          <X size={14} /> Cerrar
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', padding: '20px', boxSizing: 'border-box' }} />
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0a6', fontWeight: 600, fontSiZe: '0.9rem' }}>
          Cargando PDF...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f28b82', fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}