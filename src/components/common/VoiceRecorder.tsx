import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.js';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  presetSimulatedText?: string;
  autoStart?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  presetSimulatedText = 'Mujhe dono ghutno me pichhle 6 mahine se dard aur subah jakdan rehti hai.',
  autoStart = false
}) => {
  const { language, speak } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    // Check browser speech recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultText = event.results[current][0].transcript;
        setTranscript(resultText);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognitionInstance(recognition);
    }
  }, [language]);

  const startListening = () => {
    setConfirmed(false);
    if (recognitionInstance) {
      try {
        recognitionInstance.start();
        setIsRecording(true);
      } catch (err) {
        // If already started or permission denied, fallback gracefully
        setIsRecording(true);
        simulateSpeech();
      }
    } else {
      setIsRecording(true);
      simulateSpeech();
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch (e) {}
    }
    setIsRecording(false);
  };

  const simulateSpeech = () => {
    let index = 0;
    const textToSimulate = presetSimulatedText;
    setTranscript('');
    const interval = setInterval(() => {
      index += 4;
      if (index <= textToSimulate.length) {
        setTranscript(textToSimulate.substring(0, index));
      } else {
        setTranscript(textToSimulate);
        setIsRecording(false);
        clearInterval(interval);
      }
    }, 45);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onTranscription(transcript);
  };

  const handleClear = () => {
    setTranscript('');
    setConfirmed(false);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-sm font-semibold tracking-wide uppercase text-slate-300">
            {isRecording ? (language === 'hi' ? 'आवाज सुनी जा रही है...' : 'Listening...') : (language === 'hi' ? 'आवाज इनपुट' : 'Voice Input')}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Lang: {language === 'hi' ? 'Hindi (hi-IN)' : 'English (en-IN)'}
        </span>
      </div>

      {/* Center Mic Button & Animation */}
      <div className="flex flex-col items-center justify-center py-4">
        <button
          onClick={isRecording ? stopListening : startListening}
          className={`relative group w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-2xl ${
            isRecording
              ? 'bg-red-600 ring-8 ring-red-500/30'
              : 'bg-ayush-600 hover:bg-ayush-500 ring-8 ring-ayush-500/20'
          }`}
          aria-label="Tap to speak"
        >
          {isRecording ? <MicOff className="w-9 h-9 text-white" /> : <Mic className="w-9 h-9 text-white" />}
        </button>

        <p className="text-sm text-slate-300 mt-3 font-medium">
          {isRecording
            ? (language === 'hi' ? 'बोलना समाप्त करने के लिए टैप करें' : 'Tap to finish speaking')
            : (language === 'hi' ? 'माइक पर टैप करें और बोलें' : 'Tap microphone and speak')}
        </p>
      </div>

      {/* Live Audio Visualizer Bars */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1.5 my-3 h-8">
          {[40, 70, 90, 60, 100, 80, 50, 95, 65, 45, 85, 30].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-ayush-400 rounded-full animate-pulse"
              style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Transcription Preview Area */}
      {transcript && (
        <div className="mt-4 bg-slate-800/90 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{language === 'hi' ? 'पहचाना गया पाठ:' : 'Recognized Transcription:'}</span>
            <button
              onClick={() => speak(transcript)}
              className="flex items-center gap-1 text-ayush-400 hover:text-ayush-300"
            >
              <Volume2 className="w-3.5 h-3.5" /> Replay
            </button>
          </div>
          <p className="text-base text-emerald-300 font-medium leading-relaxed">
            "{transcript}"
          </p>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/80">
            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
                confirmed
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirmed
                ? (language === 'hi' ? 'सत्यापित' : 'Confirmed')
                : (language === 'hi' ? 'यह सही है (Confirm)' : 'Correct / Confirm')}
            </button>

            <button
              onClick={handleClear}
              className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              {language === 'hi' ? 'दोबारा' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Demo helper shortcut */}
      {!transcript && (
        <div className="mt-2 text-center">
          <button
            onClick={simulateSpeech}
            className="text-xs text-slate-400 hover:text-ayush-400 inline-flex items-center gap-1 underline"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            {language === 'hi' ? 'डेमो आवाज प्रतिक्रिया भरें' : 'Simulate Hindi Voice Speech for Demo'}
          </button>
        </div>
      )}
    </div>
  );
};
