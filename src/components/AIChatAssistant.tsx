import React, { useState } from 'react';
import { Check, Copy, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

const QUICK_PROMPTS = [
  'Which vendors are still unconfirmed?',
  'Draft a message to the caterer',
  'Write an event announcement for guests',
  'Summarize my budget vs committed spend',
];

export const AIChatAssistant: React.FC = () => {
  const { user, events, bookings, vendors, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your EventSphere AI assistant. I have read access to your events, vendor bookings, and budgets. Ask me about unconfirmed vendors, budget checks, or ask me to draft vendor emails and guest invitations.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const handleSend = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const history = nextMessages
        .filter((m) => m.id !== 'welcome')
        .slice(0, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      const { reply } = await sendChatMessage(text, history, {
        user,
        events,
        bookings,
        vendors,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-reply`,
          role: 'model',
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI assistant';
      showToast({ type: 'error', title: 'Assistant error', description: msg });
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'model',
          text: `Error: ${msg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-sm font-semibold shadow-lg transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-indigo-500 whitespace-nowrap"
          aria-label="Open EventSphere AI Assistant"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask EventSphere AI</span>
        </button>
      )}

      {/* Expandable Assistant Drawer */}
      {open && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[560px] max-h-[82vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="EventSphere AI Assistant"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  EventSphere Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Context: {events.length} events · {bookings.length} bookings
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'model' && msg.id !== 'welcome' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-1"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Analyzing workspace data...</span>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about bookings, drafts, invites..."
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
