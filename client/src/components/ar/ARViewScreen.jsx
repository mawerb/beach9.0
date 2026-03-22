import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Microphone } from '@phosphor-icons/react';
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
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import { matchFace, enrollFace } from '../../services/faceApi';
import { processTranscript } from '../../services/conversationApi';
import { fetchPersonSynopsis } from '../../services/peopleApi';
import { useSettingsStore } from '../../stores/settingsStore';

export default function ARViewScreen() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [toast, setToast] = useState(null);
  const currentLandmarksRef = useRef(null);
  const matchInFlightRef = useRef(false);
  const personRef = useRef(null);
  const lineIdCounter = useRef(0);
  const interimLineIdRef = useRef(null);

  const setFaceDetected = useARStore((s) => s.setFaceDetected);
  const setFaceUnknown = useARStore((s) => s.setFaceUnknown);
  const updateFacePosition = useARStore((s) => s.updateFacePosition);
  const setFaceLost = useARStore((s) => s.setFaceLost);
  const setSuggestions = useSuggestionStore((s) => s.setSuggestions);
  const setLoading = useSuggestionStore((s) => s.setLoading);
  const setLive = useTranscriptStore((s) => s.setLive);
  const setRecording = useTranscriptStore((s) => s.setRecording);
  const addLine = useTranscriptStore((s) => s.addLine);
  const appendToAccumulated = useTranscriptStore((s) => s.appendToAccumulated);
  const setCurrentSpeaker = useTranscriptStore((s) => s.setCurrentSpeaker);
  const clearTranscript = useTranscriptStore((s) => s.clearTranscript);
  const clearSuggestions = useSuggestionStore((s) => s.clearSuggestions);
  const setSynopsis = useARStore((s) => s.setSynopsis);
  const speechLang = useSettingsStore((s) => s.speechLang) || 'en-US';

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const getCurrentSpeaker = useCallback(() => {
    return useTranscriptStore.getState().currentSpeaker || 'user';
  }, []);

  const handleSilenceGap = useCallback(async (accumulatedText) => {
    const person = personRef.current;
    if (!person || !accumulatedText.trim()) return;

    setLoading(true);

    const result = await processTranscript({
      transcript: accumulatedText,
      person_name: person.name,
      relationship: person.relationship || '',
    });

    if (result) {
      if (result.suggestions) {
        const formatted = result.suggestions.map((s, i) => ({
          id: `s_${Date.now()}_${i}`,
          text: s.text,
          tone: (s.mood || 'casual').toLowerCase(),
          type: 'statement',
          score: 1 - i * 0.1,
        }));
        setSuggestions(formatted);
      }
      if (result.synopsis) {
        setSynopsis(result.synopsis);
        showToast(`Synopsis updated for ${person.name}`);
      }
    }

    setLoading(false);
  }, [setSuggestions, setLoading, setSynopsis, showToast]);

  const getAccumulated = useCallback(() => {
    return useTranscriptStore.getState().accumulatedText;
  }, []);

  const handleInterim = useCallback((text) => {
    const speaker = getCurrentSpeaker();
    if (!interimLineIdRef.current) {
      interimLineIdRef.current = `line_${++lineIdCounter.current}`;
    }
    addLine({
      lineId: interimLineIdRef.current,
      speaker,
      text,
      isFinal: false,
    });
  }, [addLine, getCurrentSpeaker]);

  const handleFinal = useCallback((text) => {
    const speaker = getCurrentSpeaker();
    const lineId = interimLineIdRef.current || `line_${++lineIdCounter.current}`;
    interimLineIdRef.current = null;

    addLine({ lineId, speaker, text, isFinal: true });
    appendToAccumulated(speaker, text);
  }, [addLine, appendToAccumulated, getCurrentSpeaker]);

  const { start: startListening, stop: stopListening, isListeningRef } = useSpeechRecognition({
    lang: speechLang,
    onInterim: handleInterim,
    onFinal: handleFinal,
    onSilenceGap: handleSilenceGap,
    getAccumulated,
  });

  const handleFaceDetected = useCallback(async (face, landmarks, confidence, mouthOpen) => {
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
        personRef.current = person;
        setFaceDetected(face, person, confidence);
        setLive(true);
        setRecording(true);
        startListening();

        fetchPersonSynopsis(match.person_name)
          .then((data) => {
            if (data?.synopsis) {
              setSynopsis(data.synopsis);
            }
          })
          .catch((err) => console.warn('Failed to fetch stored synopsis:', err));
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
  }, [setFaceDetected, setLive, setRecording, startListening, setFaceUnknown, setSynopsis]);

  const handleFaceUpdate = useCallback((face, landmarks, confidence, mouthOpen) => {
    currentLandmarksRef.current = landmarks;
    updateFacePosition(face, confidence);
    setCurrentSpeaker(mouthOpen ? 'them' : 'user');
  }, [updateFacePosition, setCurrentSpeaker]);

  const handleFaceLost = useCallback(() => {
    setFaceLost();
    setLive(false);
    currentLandmarksRef.current = null;
  }, [setFaceLost, setLive]);

  const { mouthOpenRef } = useFaceDetection(videoRef, {
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
      personRef.current = person;

      const currentFace = useARStore.getState().currentFace;
      if (currentFace) {
        setFaceDetected(currentFace, person, useARStore.getState().confidenceScore);
      }

      setLive(true);
      setRecording(true);
      startListening();
    } catch (err) {
      console.error('Face enrollment failed:', err);
    }

    setShowAddPerson(false);
  }, [setFaceDetected, setLive, setRecording, startListening]);

  const handleEndConversation = () => {
    const confirmed = window.confirm('End conversation?');
    if (confirmed) {
      stopListening();
      setFaceLost();
      clearTranscript();
      clearSuggestions();
      setShowAddPerson(false);
      setRecording(false);
      personRef.current = null;
      navigate('/people');
    }
  };

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  return (
    <div ref={containerRef} style={styles.container}>
      <CameraFeed videoRef={videoRef} />
      <CanvasOverlay containerRef={containerRef} />
      <InfoCard containerRef={containerRef} />
      <StatusPill onEndConversation={handleEndConversation} />
      <MicIndicator isListening={isListeningRef} />
      <TranscriptBar />
      <ResponseDrawer />

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={styles.toast}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {showAddPerson && (
        <AddPersonSheet
          onSave={handleEnrollSave}
          onDismiss={() => setShowAddPerson(false)}
        />
      )}
    </div>
  );
}

function MicIndicator({ isListening }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(isListening.current);
    }, 300);
    return () => clearInterval(interval);
  }, [isListening]);

  if (!active) return null;

  return (
    <div style={styles.micIndicator}>
      <div style={styles.micDot} />
      <Microphone size={14} weight="fill" color="#fff" />
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
  micIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(220, 38, 38, 0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: 999,
    padding: '5px 10px 5px 8px',
  },
  micDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#fff',
    animation: 'micPulse 1.2s ease-in-out infinite',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    color: '#fff',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
};
