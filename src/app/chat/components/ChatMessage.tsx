import { cn } from "~/app/utils/cn"
import { User, Bot } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface ChatMessageProps {
  content: string
  role: "user" | "assistant"
  type?: string
}

export function ChatMessage({ content, role, type }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
          <AvatarImage>
            <Bot className="h-4 w-4 text-primary" />
          </AvatarImage>
        </Avatar>
      )}

      <Card className={cn("p-2 m-2 max-w-[80%]", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <CardContent>
          <p className="text-sm">{content}</p>
          {type && !isUser && (
            <Badge variant="outline" className="mt-2 text-xs">
              {type === "main" ? "Main Question" : "Follow-up"}
            </Badge>
          )}
        </CardContent>
      </Card>

      {isUser && (
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
          <AvatarImage>
            <User className="h-4 w-4 text-primary-foreground" />
          </AvatarImage>
        </Avatar>
      )}
    </div>
  )
}
