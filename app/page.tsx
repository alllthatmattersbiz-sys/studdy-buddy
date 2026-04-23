"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            handleUserMessage(transcriptSegment);
          } else {
            interim += transcriptSegment;
          }
        }
        setTranscript(interim);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setTranscript("");

    // Get Claude response
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text,
      };
      setMessages([...newMessages, assistantMessage]);

      // Speak the response
      speakText(data.text);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🎤 Voice Study Buddy
          </h1>
          <p className="text-slate-400 mt-1">
            Ask anything. Learn everything.
          </p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <p className="text-slate-400 text-lg mb-2">
                Welcome to your Study Buddy
              </p>
              <p className="text-slate-500">
                Click the microphone below or type to ask a question
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-cyan-600 rounded-br-none"
                  : "bg-slate-700 rounded-bl-none"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isSpeaking && (
          <div className="flex justify-start mb-4">
            <div className="bg-slate-700 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Transcript display */}
          {transcript && (
            <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700 text-sm text-slate-300">
              <span className="text-slate-400">Listening: </span>
              {transcript}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={toggleListening}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              }`}
            >
              {isListening ? "🛑 Stop Listening" : "🎤 Start Speaking"}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            Grant microphone permission for voice input
          </p>
        </div>
      </footer>
    </div>
  );
}