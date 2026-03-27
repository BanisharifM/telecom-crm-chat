'use client'

import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'

// highlight.js theme for code blocks (works in both dark and light mode)
import 'highlight.js/styles/github-dark.css'

interface Props {
  content: string
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const lang = /language-(\w+)/.exec(className || '')?.[1] || ''
  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between bg-muted px-3 py-1.5 rounded-t-lg text-[11px] text-muted-foreground">
        <span className="font-medium">{lang || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="!rounded-t-none rounded-b-lg overflow-x-auto p-3 !bg-[#0d1117] text-sm !mt-0">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

export const ChatMarkdown = memo(({ content }: Props) => (
  <div className="chat-markdown">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ inline, className, children, ...props }: any) {
          if (inline) {
            return <code className="bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono" {...props}>{children}</code>
          }
          return <CodeBlock className={className}>{children}</CodeBlock>
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2 rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return <th className="bg-muted/50 px-3 py-1.5 text-left font-semibold text-xs">{children}</th>
        },
        td({ children }) {
          return <td className="px-3 py-1.5 border-t border-border">{children}</td>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
))

ChatMarkdown.displayName = 'ChatMarkdown'
