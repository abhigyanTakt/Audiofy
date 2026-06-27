import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Upload, Languages, FileText, Download, 
  Sparkles, Smile, MessageSquare, RefreshCw, Layers, Check
} from 'lucide-react';

export default function AudioDashboard({ user, onOpenAuth }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [summary, setSummary] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Ready to transcribe speech or audio files');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle Speech Recognition via Web Speech API or Audio Stream recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        uploadAudioFile(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatusText('Listening to microphone audio...');
    } catch (err) {
      console.error('Microphone error:', err);
      setStatusText('Microphone access denied or error occurred.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusText('Processing recorded audio...');
    }
  };

  const uploadAudioFile = async (fileOrBlob) => {
    setLoading(true);
    setStatusText('Transcribing audio with backend models...');
    const formData = new FormData();
    formData.append('audio', fileOrBlob, 'recording.wav');
    formData.append('language', language);

    try {
      const res = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success || data.transcription) {
        setTranscription(data.transcription || data.text || 'Transcription generated successfully.');
        setStatusText('Transcription complete!');
      } else {
        setStatusText(data.error || 'Failed to transcribe audio.');
      }
    } catch (err) {
      setStatusText('Failed to process audio file.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadAudioFile(file);
    }
  };

  const analyzeTone = async () => {
    if (!transcription) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription }),
      });
      const data = await res.json();
      if (data.success) {
        setTone(data.tone);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const translateSpeech = async () => {
    if (!transcription) return;
    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription, src_lang: language, dest_lang: targetLang }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedText(data.translated_text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!transcription) return;
    setLoading(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadDoc = (type) => {
    if (!transcription) return;
    const element = document.createElement("a");
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Audiofy_Transcription.${type}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Banner / User Greeting */}
      <div className="glass-panel" style={{
        padding: '2rem', borderRadius: '24px', marginBottom: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">
            {user ? `Welcome back, ${user.username}! 🎙️` : 'AI-Powered Speech & Voice Intelligence'}
          </h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem', fontSize: '1rem' }}>
            {user ? 'Your database session is active. All recordings and transcripts are secured.' : 'Sign in to save your transcriptions directly to your account database!'}
          </p>
        </div>
        {!user && (
          <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Sparkles size={18} /> Enable Database Sync
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Left Control Panel */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mic className="gradient-accent" size={24} /> Speech Studio Controls
          </h2>

          {/* Record Button & Wave Animation */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2.5rem 1.5rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '20px',
            border: '1px dashed rgba(255, 255, 255, 0.15)', marginBottom: '1.5rem'
          }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'recording-pulse' : ''}
              style={{
                width: '80px', height: '80px', borderRadius: '50%', border: 'none',
                background: isRecording 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: isRecording ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 10px 25px var(--primary-glow)',
                transition: 'all 0.3s ease'
              }}
            >
              {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
            </button>
            <p style={{ marginTop: '1.25rem', fontWeight: 600, color: isRecording ? '#fca5a5' : '#e5e7eb', fontSize: '0.95rem' }}>
              {isRecording ? 'Tap to Stop Recording' : 'Tap to Start Recording'}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              {statusText}
            </span>
          </div>

          {/* File Upload Dropzone */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Upload Audio File (.wav, .mp3)
            </label>
            <label className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', cursor: 'pointer' }}>
              <Upload size={18} /> Choose File
              <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Settings / Languages */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                AUDIO LANGUAGE
              </label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff'
                }}
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                TRANSLATE TO
              </label>
              <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff'
                }}
              >
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output & AI Intelligence Panel */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText className="gradient-accent" size={24} /> Transcription & Intelligence Output
          </h2>

          {/* Main Transcription Display */}
          <div style={{
            flex: 1, minHeight: '180px', padding: '1.25rem', background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem',
            color: transcription ? '#f9fafb' : '#6b7280', fontSize: '1rem', lineHeight: 1.6,
            overflowY: 'auto'
          }}>
            {transcription || 'Your speech transcription will appear here in real-time... Speak into the mic or upload an audio file.'}
          </div>

          {/* AI Tools Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button onClick={analyzeTone} disabled={!transcription || loading} className="btn-secondary" style={{ flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
              <Smile size={16} /> Analyze Sentiment
            </button>
            <button onClick={translateSpeech} disabled={!transcription || loading} className="btn-secondary" style={{ flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
              <Languages size={16} /> Translate
            </button>
            <button onClick={generateSummary} disabled={!transcription || loading} className="btn-secondary" style={{ flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}>
              <Sparkles size={16} /> AI Summary
            </button>
          </div>

          {/* Secondary AI Outputs */}
          {tone && (
            <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>
                DETECTED SENTIMENT TONE
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ecfdf5' }}>{tone}</span>
            </div>
          )}

          {translatedText && (
            <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', display: 'block', marginBottom: '0.25rem' }}>
                TRANSLATION ({targetLang.toUpperCase()})
              </span>
              <p style={{ color: '#e0e7ff', fontSize: '0.95rem' }}>{translatedText}</p>
            </div>
          )}

          {summary && (
            <div className="glass-card" style={{ marginBottom: '1rem', padding: '1rem', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', display: 'block', marginBottom: '0.25rem' }}>
                AI EXECUTIVE SUMMARY
              </span>
              <p style={{ color: '#f3e8ff', fontSize: '0.95rem' }}>{summary}</p>
            </div>
          )}

          {/* Export Downloads */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>EXPORT TRANSCRIPT</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => downloadDoc('txt')} disabled={!transcription} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                TXT
              </button>
              <button onClick={() => downloadDoc('doc')} disabled={!transcription} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                DOCX
              </button>
              <button onClick={() => downloadDoc('pdf')} disabled={!transcription} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
