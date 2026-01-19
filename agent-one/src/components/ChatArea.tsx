'use client';

import { useRef, useEffect } from 'react';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';

interface ChatAreaProps {
  messages: Message[];
  projectName?: string;
}

export default function ChatArea({ messages, projectName }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {projectName ? `${projectName} - チャット` : 'チャットエリア'}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="mb-2 text-lg">メッセージがありません</p>
              <p className="text-sm">
                プロジェクトを選択して、質問を入力してください
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
