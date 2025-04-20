import { redirect } from "next/navigation"
import { checkRole } from "@/lib/roles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageList } from "@/components/messages/message-list"
import { MessageChat } from "@/components/messages/message-chat"

export default async function MessagesPage() {
  const isAdmin = await checkRole("admin")
  if (!isAdmin) {
    redirect("/")
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-1/3 border-r">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MessageList />
          </CardContent>
        </Card>
      </div>
      <div className="w-2/3">
        <Card className="h-full rounded-none border-0">
          <CardContent className="p-0 h-full">
            <MessageChat />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 