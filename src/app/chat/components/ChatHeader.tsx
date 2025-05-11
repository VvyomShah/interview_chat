import { MessageSquare } from "lucide-react"

interface ChatHeaderProps {
  title?: string
}

export function ChatHeader({ title = "Interview Simulator" }: ChatHeaderProps) {
  return (
    <header className="bg-background border-b p-4 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center">
        <MessageSquare className="h-6 w-6 text-primary mr-2" />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
    </header>
  )
}
