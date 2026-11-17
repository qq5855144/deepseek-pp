import {
  Component,
  lazy,
  Suspense,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import type { ChatMessage as ChatMessageType } from '../../../core/types';
import { useI18n } from '../i18n';

const RichMessageContent = lazy(() => import('./RichMessageContent'));

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onRichContentRendered?: () => void;
}

interface RichMessageErrorBoundaryProps {
  children: ReactNode;
  text: string;
}

interface RichMessageErrorBoundaryState {
  failed: boolean;
}

export class RichMessageErrorBoundary extends Component<
  RichMessageErrorBoundaryProps,
  RichMessageErrorBoundaryState
> {
  state: RichMessageErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RichMessageErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Rich message rendering failed; using plain text.', error, info);
  }

  render() {
    if (this.state.failed) {
      return <PlainTextMessageContent text={this.props.text} />;
    }
    return this.props.children;
  }
}

export default function ChatMessage({
  message,
  isStreaming,
  onRichContentRendered,
}: ChatMessageProps) {
  const { t } = useI18n();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const copyMessageText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* Clipboard may be unavailable (no permission / insecure context); fail silently instead of interrupting reading */
    }
  };

  return (
    <div className={`ds-chat-message-row ${isUser ? 'ds-chat-message-row-user' : 'ds-chat-message-row-assistant'}`}>
      <div
        className={`ds-chat-message ${
          isUser
            ? 'ds-chat-message-user'
            : 'ds-chat-message-assistant'
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.text}</span>
        ) : (
          <>
            {message.reasoningText && (
              <details className="ds-chat-thinking" open={isStreaming && !message.text}>
                <summary>
                  {isStreaming && !message.text
                    ? t('sidepanel.chatPage.reasoningActive')
                    : t('sidepanel.chatPage.reasoningTitle')}
                </summary>
                <div className="whitespace-pre-wrap">{message.reasoningText}</div>
              </details>
            )}
            {message.text && (
              <div className="prose prose-sm max-w-none [&_pre]:overflow-x-auto [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:bg-[var(--ds-bg)] [&_code]:text-sm">
                <RichMessageErrorBoundary text={message.text}>
                  <Suspense fallback={<PlainTextMessageContent text={message.text} />}>
                    <RichMessageContent
                      text={message.text}
                      streaming={isStreaming}
                      onRendered={onRichContentRendered}
                    />
                  </Suspense>
                </RichMessageErrorBoundary>
              </div>
            )}
          </>
        )}
        {isStreaming && !isUser && (
          <span className="ds-chat-caret" />
        )}
        {!isUser && !isStreaming && (message.text || message.reasoningText) && (
          <div className="ds-chat-message-actions">
            <button
              type="button"
              className="ds-chat-message-action"
              title={copied ? t('sidepanel.chatPage.copied') : t('sidepanel.chatPage.copyMessage')}
              aria-label={t('sidepanel.chatPage.copyMessage')}
              onClick={copyMessageText}
            >
              {copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15V6a2 2 0 012-2h9" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlainTextMessageContent({ text }: { text: string }) {
  return <span className="whitespace-pre-wrap" data-rich-message-fallback="plain-text">{text}</span>;
}
