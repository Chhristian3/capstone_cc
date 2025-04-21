"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Plus, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  content: string
  type: string
  recipientType: string
  createdAt: string
  isRead: boolean
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "CLIENT_ANNOUNCEMENT",
    recipientType: "CLIENT_ONLY",
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/announcements")
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to fetch announcements")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editingNotification
        ? `/api/announcements?id=${editingNotification.id}`
        : "/api/announcements"
      const method = editingNotification ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
        }),
      })

      if (!response.ok) throw new Error("Failed to save announcement")

      toast.success(
        editingNotification
          ? "Announcement updated successfully"
          : "Announcement created successfully"
      )
      setIsDialogOpen(false)
      setEditingNotification(null)
      setFormData({
        title: "",
        content: "",
        type: "CLIENT_ANNOUNCEMENT",
        recipientType: "CLIENT_ONLY",
      })
      fetchNotifications()
    } catch (error) {
      console.error("Error saving announcement:", error)
      toast.error("Failed to save announcement")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete announcement")

      toast.success("Announcement deleted successfully")
      fetchNotifications()
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement")
    }
  }

  function handleEdit(notification: Notification) {
    setEditingNotification(notification)
    setFormData({
      title: notification.title,
      content: notification.content,
      type: "CLIENT_ANNOUNCEMENT",
      recipientType: "CLIENT_ONLY",
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Manage announcements for your clients
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? "Edit Announcement" : "New Announcement"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content">Content</label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingNotification(null)
                    setFormData({
                      title: "",
                      content: "",
                      type: "CLIENT_ANNOUNCEMENT",
                      recipientType: "CLIENT_ONLY",
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNotification ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Recipient Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.title}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.content}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notification.recipientType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(notification.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(notification)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 