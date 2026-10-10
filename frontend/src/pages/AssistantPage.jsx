import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, Copy, MessageSquarePlus, Sparkles, Square, ChartNoAxesCombined, FileText, Wallet, Mic, MicOff } from 'lucide-react';
import { api } from '../api/client';
import { currentMonth, monthLabel } from '../api/format';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useResource } from '../hooks/useResource';
import { MonthFilter } from './WorkspacePage';
function InlineText({
  text
}) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith('**') ? <strong key={index}>
    {part.slice(2, -2)}
  </strong> : part.startsWith('`') ? <code key={index}>
    {part.slice(1, -1)}
  </code> : part);
}
function Answer({
  text
}) {
  // React escapes content. No raw HTML from the model is rendered.
  return <div className="answer-text">
    {text.split(/\n\s*\n/).map((block, index) => {
      const lines = block.split('\n');
      if (lines.every(line => /^\s*[-*] /.test(line))) return <ul key={index}>
        {lines.map((line, i) => <li key={i}>
          <InlineText text={line.replace(/^\s*[-*] /, '')} />
        </li>)}
      </ul>;
      if (lines.every(line => /^\s*\d+[.)] /.test(line))) return <ol key={index}>
        {lines.map((line, i) => <li key={i}>
          <InlineText text={line.replace(/^\s*\d+[.)] /, '')} />
        </li>)}
      </ol>;
      return <p key={index}>
        <InlineText text={block.replace(/^#{1,6}\s+/, '')} />
      </p>;
    })}
  </div>;
}
export default function AssistantPage() {
  const {
    user
  } = useAuth();
  const {
    language,
    tamil
  } = useLanguage();
  const status = useResource(() => api('/workspace/assistant/status'), []);
  const [month, setMonth] = useState(currentMonth());
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [listening, setListening] = useState(false);
  const bottom = useRef(null);
  const input = useRef(null);
  const controller = useRef(null);
  const recognition = useRef(null);
  const sequence = useRef(0);
  const admin = user.role === 'ADMIN';
  const suggestions = tamil ? [[ChartNoAxesCombined, 'வருகைப் பதிவு', admin ? 'இந்த மாத வருகைப் பதிவை சுருக்கமாகக் கூறுங்கள்.' : 'இந்த மாத எனது வருகைப் பதிவை சுருக்கமாகக் கூறுங்கள்.'], [Wallet, 'சம்பள விவரம்', admin ? 'இந்த மாத வெளியிடப்பட்ட சம்பளத்தை சுருக்கமாகக் கூறுங்கள்.' : 'எனது சம்பளச் சீட்டின் பகுதிகளை விளக்குங்கள்.'], [FileText, 'நினைவூட்டல்', 'சான்றிதழ் சமர்ப்பிக்க ஒரு மரியாதையான நினைவூட்டலை எழுதுங்கள்.']] : [[ChartNoAxesCombined, 'Attendance overview', admin ? 'Summarize attendance this month.' : 'Summarize my attendance this month.'], [Wallet, 'Understand payroll', admin ? 'Summarize published payroll for this month.' : 'Explain the components of my payslip.'], [FileText, 'Draft a reminder', 'Draft a polite missing-certificate reminder.']];
  useEffect(() => {
    bottom.current?.scrollIntoView({
      block: 'end',
      behavior: 'smooth'
    });
  }, [messages, busy, error]);
  useEffect(() => () => {
    sequence.current++;
    controller.current?.abort();
  }, []);
  function startVoice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError(tamil ? 'இந்த உலாவியில் குரல் உள்ளீடு கிடைக்கவில்லை. Chrome பயன்படுத்தவும்.' : 'Voice input is unavailable in this browser. Try Chrome.');
      return;
    }
    recognition.current?.abort();
    const speech = new Recognition();
    recognition.current = speech;
    speech.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
    speech.interimResults = true;
    speech.continuous = false;
    const original = draft.trim();
    speech.onstart = () => {
      setListening(true);
      setError('');
    };
    speech.onresult = event => {
      const words = Array.from(event.results).map(result => result[0].transcript).join('');
      setDraft(`${original}${original && words ? ' ' : ''}${words}`);
    };
    speech.onerror = event => {
      if (event.error !== 'aborted') setError(tamil ? 'குரலைப் புரிந்துகொள்ள முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'I could not understand the voice input. Please try again.');
    };
    speech.onend = () => {
      setListening(false);
      input.current?.focus();
    };
    speech.start();
  }
  function stopVoice() {
    recognition.current?.stop();
    setListening(false);
  }
  function reset(nextMonth = month) {
    sequence.current++;
    controller.current?.abort();
    setBusy(false);
    setMessages([]);
    setError('');
    setDraft('');
    setMonth(nextMonth);
    input.current?.focus();
  }
  async function send(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || busy || !status.data?.configured) return;
    const prior = messages.filter(message => message.state !== 'failed');
    const requestId = ++sequence.current;
    const message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: question
    };
    const history = prior.slice(-12).map(({
      role,
      text
    }) => ({
      role: role === 'assistant' ? 'model' : 'user',
      text: text.slice(0, 8000)
    }));
    // Always start context with a user turn, even when older pairs fall out of the window.
    if (history[0]?.role === 'model') history.shift();
    setMessages([...messages, message]);
    setDraft('');
    setBusy(true);
    setError('');
    controller.current = new AbortController();
    try {
      const result = await api('/workspace/assistant', {
        method: 'POST',
        signal: controller.current.signal,
        body: JSON.stringify({
          question,
          month,
          history,
          language
        })
      });
      if (requestId !== sequence.current) return;
      setMessages(previous => [...previous, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.answer
      }]);
    } catch (error) {
      if (requestId !== sequence.current) return;
      setMessages(previous => previous.map(item => item.id === message.id ? {
        ...item,
        state: 'failed'
      } : item));
      setDraft(question);
      setError(error.name === 'AbortError' ? 'Response stopped. You can send your question again.' : error.message);
    } finally {
      if (requestId === sequence.current) {
        setBusy(false);
        input.current?.focus();
      }
    }
  }
  async function copy(message) {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(message.id);
    } catch {
      setError('Copy is unavailable in this browser. Select the answer text to copy it.');
    }
  }
  return <section className="chat-page" aria-label="AI assistant">
    <header className="chat-heading">
      <div>
        <span className="assistant-emblem">
          <Sparkles size={22} />
        </span>
        <div>
          <h1>
            {tamil ? 'AI உதவியாளர்' : 'AI assistant'}
          </h1>
          <p>
            {tamil ? 'உங்கள் பணியிடத்தை எளிதாகப் புரிந்துகொள்ளுங்கள்.' : 'Your workspace, explained.'}
          </p>
        </div>
      </div>
      <div className="actions">
        <MonthFilter month={month} setMonth={reset} />
        <button className="btn secondary" onClick={() => reset()} disabled={busy || !messages.length}>
          <MessageSquarePlus size={18} />
          <span>
            {tamil ? 'புதிய உரையாடல்' : 'New chat'}
          </span>
        </button>
      </div>
    </header>
    <div className="chat-scroll" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions">
      {!messages.length ? <div className="chat-welcome">
        <span className="welcome-symbol">
          <Sparkles size={34} />
        </span>
        <span className="eyebrow">AI ASSISTANT</span>
        <h2>
          {tamil ? 'நான் உங்களுக்கு எப்படி உதவலாம்?' : 'What can I help you with?'}
        </h2>
        <p>
          {tamil ? 'வருகை, சம்பளம் அல்லது உங்கள் அடுத்த பணியைப் பற்றிக் கேளுங்கள்.' : 'Ask about attendance, payroll or your next task.'}
        </p>
        <div className="prompt-grid">
          {suggestions.map(([Icon, title, prompt]) => <button key={title} onClick={() => {
            setDraft(prompt);
            input.current?.focus();
          }}>
            <Icon size={23} />
            <b>
              {title}
            </b>
            <span>
              {prompt}
            </span>
            <ArrowUp size={17} />
          </button>)}
        </div>
      </div> : <div className="conversation">
        {messages.map(message => <article key={message.id} className={`chat-message ${message.role} ${message.state || ''}`}>
          <span className="message-avatar" aria-hidden="true">
            {message.role === 'assistant' ? <Sparkles size={19} /> : user.username[0].toUpperCase()}
          </span>
          <div className="message-content">
            <span className="message-author">
              {message.role === 'assistant' ? tamil ? 'AI உதவியாளர்' : 'AI assistant' : tamil ? 'நீங்கள்' : 'You'}
            </span>
            <div className="message-bubble">
              {message.role === 'assistant' ? <Answer text={message.text} /> : <p>
                {message.text}
              </p>}
            </div>
            {message.role === 'assistant' && <button className="copy-answer" onClick={() => copy(message)} aria-label="Copy answer">
              {copied === message.id ? <Check size={15} /> : <Copy size={15} />}
              {copied === message.id ? tamil ? 'நகலெடுக்கப்பட்டது' : 'Copied' : tamil ? 'நகலெடு' : 'Copy'}
            </button>}
            {message.state === 'failed' && <small className="muted">Not answered</small>}
          </div>
        </article>)}
        {busy && <div className="chat-message assistant">
          <span className="message-avatar">
            <Sparkles size={19} />
          </span>
          <div className="thinking" role="status">
            <span />
            <span />
            <span />
            <small>
              {tamil ? 'பதிலைத் தயாரிக்கிறது' : 'Preparing your answer'}
            </small>
          </div>
        </div>}
      </div>}
      <div ref={bottom} />
    </div>
    <footer className="chat-footer">
      {(error || status.error) && <div className="alert" role="alert">
        {error || status.error}
        {status.error && <button className="btn text" onClick={status.reload}>Retry connection</button>}
      </div>}
      {status.data && !status.data.configured && <div className="info-note">
        {tamil ? 'AI இன்னும் இணைக்கப்படவில்லை. அமைப்பை முடிக்க நிர்வாகியிடம் கேளுங்கள்.' : 'AI is not connected yet. Ask your administrator to complete the setup.'}
      </div>}
      <form className="chat-composer" onSubmit={send}>
        <label className="sr-only" htmlFor="chat-message">Message the assistant</label>
        <textarea ref={input} id="chat-message" rows={2} placeholder={tamil ? 'உங்கள் பணியிடத்தைப் பற்றி கேளுங்கள்…' : 'Ask anything about your workspace…'} value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form.requestSubmit();
          }
        }} />
        <div className="composer-bottom">
          <span>
            <span className="connection-dot" />
            {monthLabel(month)}
          </span>
          <div className="composer-actions">
            <button type="button" className={`voice-button ${listening ? 'listening' : ''}`} aria-label={listening ? 'Stop voice input' : 'Start voice input'} title={tamil ? 'குரல் மூலம் உள்ளிடவும்' : 'Type with your voice'} onClick={listening ? stopVoice : startVoice}>
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            {busy ? <button type="button" className="send-button" aria-label="Stop response" onClick={() => controller.current?.abort()}>
              <Square size={17} />
            </button> : <button type="submit" className="send-button" aria-label="Send message" disabled={!draft.trim() || !status.data?.configured}>
              <ArrowUp size={23} />
            </button>}
          </div>
        </div>
      </form>
      <p className="chat-disclaimer">{tamil ? 'AI தவறு செய்யலாம். முக்கிய விவரங்களைச் சரிபார்க்கவும்.' : 'AI can make mistakes. Check important details.'} <span>
          {tamil ? 'உங்கள் கேள்வியும் அனுமதிக்கப்பட்ட அறிக்கையும் Gemini உடன் பகிரப்படும்.' : 'Your question and permitted report are shared with Gemini.'}
        </span></p>
    </footer>
  </section>;
}
