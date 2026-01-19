'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const components: Components = {
    code({ className: codeClassName, children, ...props }) {
      const match = /language-(\w+)/.exec(codeClassName || '');
      const isInline = !match && !String(children).includes('\n');
      
      if (isInline) {
        return (
          <code
            className="rounded bg-gray-200 px-1.5 py-0.5 text-sm font-mono text-gray-800"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="my-3 overflow-hidden rounded-lg">
          {match && (
            <div className="bg-gray-700 px-4 py-2 text-xs text-gray-300">
              {match[1]}
            </div>
          )}
          <SyntaxHighlighter
            style={oneDark}
            language={match ? match[1] : 'text'}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: match ? '0 0 0.5rem 0.5rem' : '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
    p({ children }) {
      return <p className="mb-3 last:mb-0">{children}</p>;
    },
    ul({ children }) {
      return <ul className="mb-3 ml-4 list-disc last:mb-0">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mb-3 ml-4 list-decimal last:mb-0">{children}</ol>;
    },
    li({ children }) {
      return <li className="mb-1">{children}</li>;
    },
    h1({ children }) {
      return <h1 className="mb-3 text-xl font-bold">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="mb-2 text-lg font-bold">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="mb-2 text-base font-bold">{children}</h3>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="mb-3 border-l-4 border-gray-300 pl-4 italic text-gray-600">
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {children}
        </a>
      );
    },
    table({ children }) {
      return (
        <div className="mb-3 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-gray-300 px-4 py-2">{children}</td>
      );
    },
    hr() {
      return <hr className="my-4 border-gray-300" />;
    },
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
