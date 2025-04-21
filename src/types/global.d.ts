export {}

// Create a type for the roles
export type Roles = "admin" | "moderator"

export interface Notification {
  id: string
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
