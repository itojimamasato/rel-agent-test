'use client';

import { Message } from '@/types';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">{isUser ? '👤' : '🤖'}</span>
          <span className="text-xs opacity-70">
            {isUser ? 'あなた' : 'AGENT-One'}
          </span>
        </div>
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-gray-500">
              {message.content ? '回答中...' : '考え中...'}
            </span>
          </div>
        ) : isUser ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
        {message.isLoading && message.content && (
          <div className="mt-2">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}
