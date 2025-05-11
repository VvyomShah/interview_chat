"use client"

import type { ReactNode } from "react"
import { useConversations } from "~/hooks/useConversations"
import { ChatSidebar } from "./ChatSidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "~/components/ui/sidebar"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Separator } from "~/components/ui/separator"

interface ChatLayoutProps {
  children: ReactNode
  conversationId: string | null
  onSelectConversation: (id: string) => void
  onStartNewConversation: () => Promise<void>
}

export function ChatLayout({
  children,
  conversationId,
  onSelectConversation,
  onStartNewConversation,
}: ChatLayoutProps) {
  const { conversations, isLoading, error } = useConversations()

  return (
    <SidebarProvider>
      {/* Enhanced Sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={onSelectConversation}
        onStartNewConversation={onStartNewConversation}
        isLoading={isLoading}
      />

      {/* Main content */}
      <SidebarInset>
        <header className="bg-background border-b p-4 shadow-sm flex items-center">
          <SidebarTrigger className="mr-2" />
          <Separator orientation="vertical" className="h-6 mx-2" />
          <h1 className="text-xl font-semibold">Interview Simulator</h1>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden p-4 flex flex-col">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error.message || "An error occurred. Please try again."}</AlertDescription>
            </Alert>
          )}

          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
