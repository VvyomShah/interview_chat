"use client"
import { Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

interface WelcomeCardProps {
  onStartInterview: () => void
  isLoading: boolean
}

export function WelcomeCard({ onStartInterview, isLoading }: WelcomeCardProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Interview Simulator</CardTitle>
          <CardDescription>
            The system will ask you common interview questions
            and provide follow-up questions based on your responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onStartInterview} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              "Start Interview"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
