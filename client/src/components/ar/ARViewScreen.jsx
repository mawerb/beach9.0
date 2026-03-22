import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraFeed from './CameraFeed';
import CanvasOverlay from './CanvasOverlay';
import InfoCard from './InfoCard';
import StatusPill from '../status/StatusPill';
import TranscriptBar from '../status/TranscriptBar';
import ResponseDrawer from '../suggestions/ResponseDrawer';
import { useARStore } from '../../stores/arStore';
import { useSuggestionStore } from '../../stores/suggestionStore';
import { useTranscriptStore } from '../../stores/transcriptStore';
import useFaceDetection from '../../hooks/useFaceDetection';
import { MOCK_PEOPLE, MOCK_SUGGESTIONS_MARGARET } from '../../mock/mockData';

export default function ARViewScreen() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const setFaceDetected = useARStore((s) => s.setFaceDetected);
  const updateFacePosition = useARStore((s) => s.updateFacePosition);
  const setFaceLost = useARStore((s) => s.setFaceLost);
  const setSuggestions = useSuggestionStore((s) => s.setSuggestions);
  const setLoading = useSuggestionStore((s) => s.setLoading);
  const setLive = useTranscriptStore((s) => s.setLive);
  const addLine = useTranscriptStore((s) => s.addLine);
  const clearTranscript = useTranscriptStore((s) => s.clearTranscript);
  const clearSuggestions = useSuggestionStore((s) => s.clearSuggestions);

  const handleFaceDetected = useCallback((face, confidence) => {
    const person = MOCK_PEOPLE[0];
    setFaceDetected(face, person, confidence);
    setLive(true);
    setLoading(true);

    setTimeout(() => setSuggestions(MOCK_SUGGESTIONS_MARGARET), 500);

    setTimeout(() => {
      addLine({
        lineId: `auto_${Date.now()}`,
        speaker: 'them',
        text: `Hi there! It's ${person.name.split(' ')[0]}.`,
        isFinal: true,
      });
    }, 1200);
  }, [setFaceDetected, setLive, setLoading, setSuggestions, addLine]);

  const handleFaceUpdate = useCallback((face, confidence) => {
    updateFacePosition(face, confidence);
  }, [updateFacePosition]);

  const handleFaceLost = useCallback(() => {
    setFaceLost();
    setLive(false);
  }, [setFaceLost, setLive]);

  useFaceDetection(videoRef, {
    onFaceDetected: handleFaceDetected,
    onFaceUpdate: handleFaceUpdate,
    onFaceLost: handleFaceLost,
  });

  const handleEndConversation = () => {
    const confirmed = window.confirm('End conversation?');
    if (confirmed) {
      setFaceLost();
      clearTranscript();
      clearSuggestions();
      navigate('/people');
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <CameraFeed videoRef={videoRef} />
      <CanvasOverlay containerRef={containerRef} />
      <InfoCard containerRef={containerRef} />
      <StatusPill onEndConversation={handleEndConversation} />
      <TranscriptBar />
      <ResponseDrawer />
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100dvh',
    overflow: 'hidden',
    background: '#0a0e14',
  },
};
