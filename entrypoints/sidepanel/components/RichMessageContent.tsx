import { useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useThrottledStreamText } from '../hooks/useThrottledStreamText';

interface RichMessageContentProps {
  text: string;
  streaming?: boolean;
  onRendered?: () => void;
}

export default function RichMessageContent({
  text,
  streaming = false,
  onRendered,
}: RichMessageContentProps) {
  // Throttle by the previous render cost while streaming so the whole Markdown block is not re-parsed per token
  const visibleText = useThrottledStreamText(text, streaming);

  useLayoutEffect(() => {
    onRendered?.();
  }, [onRendered, visibleText]);

  return <ReactMarkdown>{visibleText}</ReactMarkdown>;
}
