import { useEffect, useRef } from 'react';

interface DotMatrixVideoProps {
  src: string;
  /** Number of dot columns; row count is derived from the video's aspect ratio. */
  cols?: number;
  /** 'source' samples the video's own color per cell; any CSS color draws flat ink dots. */
  color?: string;
  /** Ink amount (0-1) below which a cell is left empty. */
  threshold?: number;
  invert?: boolean;
  /** Dark background with light ink instead of light background with dark ink. */
  darkMode?: boolean;
  /** Contrast/saturation boost applied to sampled colors when color="source". */
  saturation?: number;
  /** Crop video to fill the container (like object-fit: cover) instead of letterboxing. */
  cover?: boolean;
  className?: string;
}

export default function DotMatrixVideo({
  src,
  cols = 110,
  color = 'source',
  threshold = 0.1,
  invert = false,
  darkMode = false,
  saturation = 2.5,
  cover = true,
  className = '',
}: DotMatrixVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !sampleCtx) return;

    const dpr = window.devicePixelRatio || 1;
    let rafId: number;

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh || video.readyState < 2) return;

      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 600;
      const height = parent ? parent.clientHeight : (vh / vw) * width;
      const cellSize = width / cols;
      const rows = Math.max(1, Math.round(height / cellSize));

      const pxW = Math.floor(width * dpr);
      const pxH = Math.floor(height * dpr);
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      // Crop the source video so the sampled region matches the canvas aspect ratio.
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (cover) {
        const videoAspect = vw / vh;
        const boxAspect = width / height;
        if (videoAspect > boxAspect) {
          sw = vh * boxAspect;
          sx = (vw - sw) / 2;
        } else {
          sh = vw / boxAspect;
          sy = (vh - sh) / 2;
        }
      }

      sampleCanvas.width = cols;
      sampleCanvas.height = rows;
      sampleCtx.drawImage(video, sx, sy, sw, sh, 0, 0, cols, rows);
      const { data } = sampleCtx.getImageData(0, 0, cols, rows);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = darkMode ? '#000' : '#fff';
      ctx.fillRect(0, 0, width, height);

      const half = cellSize / 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const ink = invert ? luminance : 1 - luminance;
          if (ink < threshold) continue;

          const radius = Math.sqrt(ink) * half * 0.85;
          if (radius < 0.4) continue;

          if (color === 'source') {
            const avg = (r + g + b) / 3;
            const boost = (channel: number) =>
              Math.max(0, Math.min(255, avg + (channel - avg) * saturation)) | 0;
            ctx.fillStyle = `rgb(${boost(r)}, ${boost(g)}, ${boost(b)})`;
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = color;
            ctx.globalAlpha = ink;
          }

          const cx = col * cellSize + half;
          const cy = row * cellSize + half;
          ctx.beginPath();
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx + radius, cy);
          ctx.lineTo(cx, cy + radius);
          ctx.lineTo(cx - radius, cy);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    };

    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.play().catch(() => {});
    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [src, cols, color, threshold, invert, darkMode, saturation, cover]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video ref={videoRef} src={src} style={{ display: 'none' }} muted loop playsInline />
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
