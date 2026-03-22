import { useEffect, useRef, useState } from 'react';

export default function CameraFeed({ videoRef: externalRef }) {
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      } catch (err) {
        setError(err.name === 'NotAllowedError' ? 'permission' : 'unavailable');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [ref]);

  if (error === 'permission') {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.errorIcon}>📷</div>
        <h2 style={styles.errorTitle}>Camera access is needed</h2>
        <p style={styles.errorDesc}>
          Please allow camera access in your browser settings to use this app.
        </p>
      </div>
    );
  }

  if (error === 'unavailable') {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Camera unavailable</h2>
        <p style={styles.errorDesc}>No camera was found on this device.</p>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      style={styles.video}
    />
  );
}

const styles = {
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  errorScreen: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-paper)',
    padding: '40px',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  errorTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    color: 'var(--color-ink)',
    marginBottom: '12px',
  },
  errorDesc: {
    color: 'var(--color-ink2)',
    maxWidth: '320px',
    lineHeight: 1.6,
  },
};
