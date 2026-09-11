/**
 * AiChatCompanion.tsx
 * Real-time companion conversation box with voice synchronization.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, CornerDownLeft } from 'lucide-react';
import { apiService, ChatMessage } from '../services/apiService';
import { voiceManager } from '../services/VoiceManager';

export const AiChatCompanion: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(apiService.getMessages());
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(apiService.getIsThinking());
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = apiService.subscribe(() => {
      setMessages(apiService.getMessages());
      setIsThinking(apiService.getIsThinking());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await apiService.sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Browser speech recognition if supported
  const toggleSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      apiService.sendMessage(transcript);
    };

    recognition.start();
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Talk to TARA
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                Synchronized Voice & Mouth
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Type or speak commands like "Sing a song", "Cook dinner", or ask questions
            </p>
          </div>
        </div>

        <button
          onClick={() => apiService.clearMessages()}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'tara' && (
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-mono">
                T
              </div>
            )}
            <div
              className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-xs'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
              }`}
            >
              <div>{m.text}</div>
              <div className="mt-1 text-[10px] opacity-60 flex justify-between gap-4 font-mono">
                <span>{m.timestamp}</span>
                {m.emotion && <span className="capitalize">[{m.emotion}]</span>}
              </div>
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 text-[10px]">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-2.5 items-center text-xs text-slate-400 italic">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>TARA is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSpeechRecognition}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Voice input"
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Talk to TARA... (e.g., 'Sing a song', 'Cook dinner', 'Read a book')"
          className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-cyan-500 outline-none placeholder:text-slate-500"
        />

        <button
          onClick={handleSend}
          className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shadow-md shadow-cyan-900/40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
