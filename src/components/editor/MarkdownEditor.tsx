import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Edit, 
  Save, 
  Undo, 
  Redo,
  Bold,
  Italic,
  Link,
  Image,
  List,
  Code
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  className?: string
}

export function MarkdownEditor({ 
  content, 
  onChange, 
  onSave,
  className 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
    const chars = content.length
    setWordCount(words)
    setCharCount(chars)
  }, [content])

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end)
    
    onChange(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), tooltip: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), tooltip: 'Italic' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), tooltip: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), tooltip: 'Image' },
    { icon: List, action: () => insertMarkdown('- '), tooltip: 'List' },
    { icon: Code, action: () => insertMarkdown('`', '`'), tooltip: 'Code' },
  ]

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'edit' && (
            <div className="flex items-center gap-1 ml-4">
              {toolbarButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  className="p-2"
                  title={button.tooltip}
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={onSave} size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="edit" className="h-full m-0">
            <Textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Start writing your content in Markdown..."
              className="h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full m-0">
            <div className="h-full overflow-auto p-6">
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mb-3 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-medium mb-2 text-foreground">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className={className}>{children}</code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {content || '*Start writing to see preview...*'}
                </ReactMarkdown>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Markdown
          </Badge>
          <span className="text-xs text-muted-foreground">
            Auto-save enabled
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Last saved: just now
        </div>
      </div>
    </Card>
  )
}