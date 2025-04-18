"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Star } from "lucide-react"

interface UserDetailsModalProps {
  userId: string | null
  onClose: () => void
}

interface UserDetails {
  user: {
    firstName: string | null
    lastName: string | null
    emailAddresses: { emailAddress: string }[]
    imageUrl: string | null
    publicMetadata: {
      role?: string | null
    }
  }
  appointments: {
    id: string
    title: string
    appointmentDate: string
    status: string
    serviceType: {
      name: string
    }
    rating?: {
      ratingValue: string
      comment?: string
    }
  }[]
  mostUsedServiceType: {
    name: string
    description?: string
  } | null
  averageRating: number
  totalAppointments: number
  completedAppointments: number
}

export function UserDetailsModal({ userId, onClose }: UserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserDetails() {
      if (!userId) return

      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/users/${userId}`)
        if (!response.ok) throw new Error("Failed to fetch user details")
        const data = await response.json()
        setUserDetails(data)
      } catch (error) {
        setError("Failed to fetch user details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId])

  if (!userId) return null

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || ""
    const last = lastName?.[0] || ""
    return `${first}${last}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800"
    if (rating >= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : userDetails ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userDetails.user.imageUrl || undefined} />
                <AvatarFallback>
                  {getInitials(userDetails.user.firstName, userDetails.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {userDetails.user.firstName || userDetails.user.lastName
                    ? `${userDetails.user.firstName || ""} ${userDetails.user.lastName || ""}`.trim()
                    : "N/A"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userDetails.user.emailAddresses[0]?.emailAddress || "N/A"}
                </p>
                <Badge variant={userDetails.user.publicMetadata.role ? "default" : "secondary"}>
                  {userDetails.user.publicMetadata.role || "No Role"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Total Appointments</h4>
                <p className="text-2xl font-bold">{userDetails.totalAppointments}</p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Completed Appointments</h4>
                <p className="text-2xl font-bold">{userDetails.completedAppointments}</p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Average Rating</h4>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{userDetails.averageRating.toFixed(1)}</p>
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
            </div>

            {userDetails.mostUsedServiceType && (
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Most Used Service</h4>
                <p className="text-lg font-semibold">{userDetails.mostUsedServiceType.name}</p>
                {userDetails.mostUsedServiceType.description && (
                  <p className="text-sm text-muted-foreground">
                    {userDetails.mostUsedServiceType.description}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDetails.appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.title}</TableCell>
                        <TableCell>{appointment.serviceType.name}</TableCell>
                        <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {appointment.rating ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getRatingColor(
                                  appointment.rating.ratingValue === "VerySatisfied"
                                    ? 5
                                    : appointment.rating.ratingValue === "Satisfied"
                                    ? 4
                                    : appointment.rating.ratingValue === "Neutral"
                                    ? 3
                                    : appointment.rating.ratingValue === "Dissatisfied"
                                    ? 2
                                    : 1
                                )}
                              >
                                {appointment.rating.ratingValue}
                              </Badge>
                              {appointment.rating.comment && (
                                <span className="text-sm text-muted-foreground">
                                  {appointment.rating.comment}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No rating</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
} 