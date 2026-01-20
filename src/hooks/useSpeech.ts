import { useState, useEffect, useCallback } from 'react';

// Type definitions for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const { webkitSpeechRecognition }: IWindow = window as unknown as IWindow;
    const SpeechRecognition = webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true; // Keep listening
      recognitionInstance.interimResults = true; // Show results as they are spoken
      recognitionInstance.lang = 'ko-KR';

      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onend = () => setIsListening(false);
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            console.error("Speech recognition error:", e);
        }
    } else {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.");
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
        recognition.stop();
    }
  }, [recognition]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel existing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0; // Normal speed for seniors
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
        console.error("TTS not supported");
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    setTranscript, // Allow manual clearing
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    isSpeaking
  };
};
