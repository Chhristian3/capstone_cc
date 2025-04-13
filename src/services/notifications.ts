import { Notification } from "@prisma/client"

const API_URL = "/api/notifications"

export interface CreateNotificationInput {
  userId?: string
  recipientType: "ALL" | "SPECIFIC_USER"
  type: string
  title: string
  content: string
  referenceId?: string
}

export async function getNotifications(params?: {
  userId?: string
  recipientType?: string
  isRead?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (params?.userId) searchParams.append("userId", params.userId)
  if (params?.recipientType) searchParams.append("recipientType", params.recipientType)
  if (params?.isRead !== undefined) searchParams.append("isRead", params.isRead.toString())

  const response = await fetch(`${API_URL}?${searchParams.toString()}`)
  if (!response.ok) throw new Error("Failed to fetch notifications")
  return response.json() as Promise<Notification[]>
}

export async function createNotification(data: CreateNotificationInput) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error("Failed to create notification")
  return response.json() as Promise<Notification>
}

export async function markAsRead(id: string) {
  const response = await fetch(`${API_URL}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead: true }),
  })
  if (!response.ok) throw new Error("Failed to mark notification as read")
  return response.json() as Promise<Notification>
}

export async function markAllAsRead() {
  const response = await fetch(`${API_URL}/mark-all-read`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  })
  if (!response.ok) throw new Error("Failed to mark all notifications as read")
  return response.json()
}

export async function deleteNotification(id: string) {
  const response = await fetch(`${API_URL}?id=${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete notification")
  return response.json()
} 