import { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraFeed from './CameraFeed';
import CanvasOverlay from './CanvasOverlay';
import InfoCard from './InfoCard';
import StatusPill from '../status/StatusPill';
import TranscriptBar from '../status/TranscriptBar';
import ResponseDrawer from '../suggestions/ResponseDrawer';
import AddPersonSheet from '../people/AddPersonSheet';
import { useARStore } from '../../stores/arStore';
import { useSuggestionStore } from '../../stores/suggestionStore';
import { useTranscriptStore } from '../../stores/transcriptStore';
import useFaceDetection from '../../hooks/useFaceDetection';
import { matchFace, enrollFace } from '../../services/faceApi';
import { MOCK_SUGGESTIONS_MARGARET } from '../../mock/mockData';

export default function ARViewScreen() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [showAddPerson, setShowAddPerson] = useState(false);
  const currentLandmarksRef = useRef(null);
  const matchInFlightRef = useRef(false);

  const setFaceDetected = useARStore((s) => s.setFaceDetected);
  const setFaceUnknown = useARStore((s) => s.setFaceUnknown);
  const updateFacePosition = useARStore((s) => s.updateFacePosition);
  const setFaceLost = useARStore((s) => s.setFaceLost);
  const setSuggestions = useSuggestionStore((s) => s.setSuggestions);
  const setLoading = useSuggestionStore((s) => s.setLoading);
  const setLive = useTranscriptStore((s) => s.setLive);
  const addLine = useTranscriptStore((s) => s.addLine);
  const clearTranscript = useTranscriptStore((s) => s.clearTranscript);
  const clearSuggestions = useSuggestionStore((s) => s.clearSuggestions);

  const handleFaceDetected = useCallback(async (face, landmarks, confidence) => {
    currentLandmarksRef.current = landmarks;

    if (matchInFlightRef.current) return;
    matchInFlightRef.current = true;

    try {
      const { match } = await matchFace(landmarks);

      if (match) {
        const person = {
          id: match.face_id,
          name: match.person_name,
          relationship: match.relationship,
        };
        setFaceDetected(face, person, confidence);
        setLive(true);
        setLoading(true);
        setTimeout(() => setSuggestions(MOCK_SUGGESTIONS_MARGARET), 500);

        setTimeout(() => {
          addLine({
            lineId: `auto_${Date.now()}`,
            speaker: 'them',
            text: `Hi there! It's ${match.person_name.split(' ')[0]}.`,
            isFinal: true,
          });
        }, 1200);
      } else {
        setFaceUnknown(face);
        setShowAddPerson(true);
      }
    } catch (err) {
      console.warn('Face match request failed:', err);
      setFaceUnknown(face);
      setShowAddPerson(true);
    } finally {
      matchInFlightRef.current = false;
    }
  }, [setFaceDetected, setLive, setLoading, setSuggestions, addLine]);

  const handleFaceUpdate = useCallback((face, landmarks, confidence) => {
    currentLandmarksRef.current = landmarks;
    updateFacePosition(face, confidence);
  }, [updateFacePosition]);

  const handleFaceLost = useCallback(() => {
    setFaceLost();
    setLive(false);
    currentLandmarksRef.current = null;
  }, [setFaceLost, setLive]);

  useFaceDetection(videoRef, {
    onFaceDetected: handleFaceDetected,
    onFaceUpdate: handleFaceUpdate,
    onFaceLost: handleFaceLost,
  });

  const handleEnrollSave = useCallback(async (personData) => {
    const landmarks = currentLandmarksRef.current;
    if (!landmarks) {
      console.warn('No landmarks available for enrollment');
      setShowAddPerson(false);
      return;
    }

    try {
      const result = await enrollFace({
        person_name: personData.name,
        relationship: personData.relationship,
        relationship_type: personData.relationshipType,
        landmarks,
      });

      const person = {
        id: result.face_id,
        name: personData.name,
        relationship: personData.relationship,
      };

      const currentFace = useARStore.getState().currentFace;
      if (currentFace) {
        setFaceDetected(currentFace, person, useARStore.getState().confidenceScore);
      }

      setLive(true);
      setLoading(true);
      setTimeout(() => setSuggestions(MOCK_SUGGESTIONS_MARGARET), 500);
    } catch (err) {
      console.error('Face enrollment failed:', err);
    }

    setShowAddPerson(false);
  }, [setFaceDetected, setLive, setLoading, setSuggestions]);

  const handleEndConversation = () => {
    const confirmed = window.confirm('End conversation?');
    if (confirmed) {
      setFaceLost();
      clearTranscript();
      clearSuggestions();
      setShowAddPerson(false);
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
      {showAddPerson && (
        <AddPersonSheet
          onSave={handleEnrollSave}
          onDismiss={() => setShowAddPerson(false)}
        />
      )}
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
