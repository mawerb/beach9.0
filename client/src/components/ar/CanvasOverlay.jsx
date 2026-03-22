import { useEffect, useRef } from 'react';
import { useARStore } from '../../stores/arStore';

export default function CanvasOverlay({ containerRef }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const sweepProgress = useRef(0);
  const sweepActive = useRef(false);
  const prevStatus = useRef('idle');

  useEffect(() => {
    function draw() {
      rafRef.current = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const container = containerRef?.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width) canvas.width = rect.width;
      if (canvas.height !== rect.height) canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { currentFace, detectionStatus, confidenceScore } = useARStore.getState();

      if (!currentFace) {
        sweepProgress.current = 0;
        sweepActive.current = false;
        prevStatus.current = 'idle';
        return;
      }

      const fx = currentFace.x * canvas.width;
      const fy = currentFace.y * canvas.height;
      const fw = currentFace.width * canvas.width;
      const fh = currentFace.height * canvas.height;

      if (detectionStatus === 'found' && prevStatus.current !== 'found') {
        sweepActive.current = true;
        sweepProgress.current = 0;
      }
      prevStatus.current = detectionStatus;

      if (sweepActive.current && sweepProgress.current < 1) {
        sweepProgress.current = Math.min(1, sweepProgress.current + 0.03);

        ctx.save();
        ctx.beginPath();
        ctx.rect(fx, fy, fw, fh * sweepProgress.current);
        ctx.clip();

        ctx.strokeStyle = 'rgba(74, 124, 111, 0.3)';
        ctx.lineWidth = 1;
        const sweepY = fy + fh * sweepProgress.current;
        ctx.beginPath();
        ctx.moveTo(fx, sweepY);
        ctx.lineTo(fx + fw, sweepY);
        ctx.stroke();

        ctx.restore();

        if (sweepProgress.current >= 1) sweepActive.current = false;
      }

      const isLowConfidence = confidenceScore < 0.7;
      const cornerLen = Math.min(fw, fh) * 0.15;
      const bracketAlpha = sweepActive.current ? sweepProgress.current : 1;

      ctx.strokeStyle = isLowConfidence ? '#92600a' : '#4a7c6f';
      ctx.lineWidth = 2;
      ctx.globalAlpha = bracketAlpha;

      if (isLowConfidence) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      // Top-left
      ctx.beginPath();
      ctx.moveTo(fx, fy + cornerLen);
      ctx.lineTo(fx, fy);
      ctx.lineTo(fx + cornerLen, fy);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(fx + fw - cornerLen, fy);
      ctx.lineTo(fx + fw, fy);
      ctx.lineTo(fx + fw, fy + cornerLen);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(fx + fw, fy + fh - cornerLen);
      ctx.lineTo(fx + fw, fy + fh);
      ctx.lineTo(fx + fw - cornerLen, fy + fh);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(fx + cornerLen, fy + fh);
      ctx.lineTo(fx, fy + fh);
      ctx.lineTo(fx, fy + fh - cornerLen);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
