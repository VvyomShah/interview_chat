"use client"

import { format } from "date-fns"
import { MessageSquare, Plus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"

interface Conversation {
  id: string
  title: string
  createdAt: Date
  hasEnded: boolean
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onStartNewConversation: () => void
  isLoading: boolean
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onStartNewConversation,
  isLoading,
}: ChatSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Interviews
          </h2>
        </div>
        <div className="px-4 pb-2">
          <Button className="w-full" onClick={onStartNewConversation} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Loading..." : "New Interview"}
          </Button>
        </div>
        <Separator className="my-2" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {conversations.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <SidebarMenuButton
                isActive={conversation.id === currentConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                className="w-full flex flex-col items-start"
              >
                <div className="flex items-center w-full">
                  <span className="truncate font-medium">{conversation.title}</span>
                </div>
                <div className="flex items-center justify-between w-full mt-1 text-xs text-muted-foreground">
                  <span>{format(new Date(conversation.createdAt), "MMM d, yyyy")}</span>
                  {conversation.hasEnded && <span className="text-destructive">Ended</span>}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {conversations.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">No interviews yet. Start a new one!</div>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground border-t">
          <p>Interview Simulator v1.0</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
