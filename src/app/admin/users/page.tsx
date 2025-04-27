"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, MoreHorizontal, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserDetailsModal } from "@/components/admin/UserDetailsModal"
import { Shell } from "@/components/ui/shell"

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  primaryEmailAddressId: string
  emailAddresses: {
    id: string
    emailAddress: string
  }[]
  publicMetadata: {
    role?: string | null
  }
  imageUrl?: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/admin/users?search=${searchQuery}`)
        if (!response.ok) throw new Error("Failed to fetch users")
        const data = await response.json()
        setUsers(data || [])
      } catch (error) {
        setError("Failed to fetch users")
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [searchQuery, toast])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/admin/users?search=${searchQuery}`)
  }

  const handleRoleChange = async (userId: string, action: "makeAdmin" | "removeRole") => {
    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action,
        }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      const updatedUsers = users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            publicMetadata: {
              role: action === "makeAdmin" ? "admin" : null,
            },
          }
        }
        return user
      })

      setUsers(updatedUsers)
      toast({
        title: "Success",
        description: `Role ${action === "makeAdmin" ? "added" : "removed"} successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const handleMessageUser = async (userId: string) => {
    try {
      // First check if there's an existing instance
      const instanceResponse = await fetch(`/api/messages/instances?clientId=${userId}`)
      if (!instanceResponse.ok) throw new Error("Failed to check message instance")
      
      const instances = await instanceResponse.json()
      let instanceId = instances[0]?.id

      // If no instance exists, create one
      if (!instanceId) {
        const createInstanceResponse = await fetch("/api/messages/instances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: userId,
          }),
        })

        if (!createInstanceResponse.ok) throw new Error("Failed to create message instance")
        
        const newInstance = await createInstanceResponse.json()
        instanceId = newInstance.id
      }

      // Redirect to messages page with the instance
      router.push(`/admin/messages?clientId=${userId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    }
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || ""
    const last = lastName?.[0] || ""
    return `${first}${last}`.toUpperCase()
  }

  const capitalizeRole = (role: string | null | undefined) => {
    if (!role || role === "moderator") return "Client"
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const getRoleBadgeVariant = (role: string | null | undefined) => {
    if (role === "admin") return "default"
    return "outline"
  }

  const getRoleBadgeStyle = (role: string | null | undefined) => {
    if (role === "admin") return {}
    return { backgroundColor: "white", color: "black" }
  }

  const adminUsers = users.filter(user => user.publicMetadata.role === "admin")
  const clientUsers = users.filter(user => user.publicMetadata.role !== "admin")

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and their roles.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Client Users Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Clients</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : clientUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  clientUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.imageUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {user.firstName || user.lastName
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.emailAddresses.find(
                          (email) => email.id === user.primaryEmailAddressId
                        )?.emailAddress || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(user.publicMetadata.role)}
                          style={getRoleBadgeStyle(user.publicMetadata.role)}
                        >
                          {capitalizeRole(user.publicMetadata.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageUser(user.id)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Admin Users Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Administrators</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : adminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No administrators found
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.imageUrl || undefined} />
                            <AvatarFallback>
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {user.firstName || user.lastName
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.emailAddresses.find(
                          (email) => email.id === user.primaryEmailAddressId
                        )?.emailAddress || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(user.publicMetadata.role)}
                          style={getRoleBadgeStyle(user.publicMetadata.role)}
                        >
                          {capitalizeRole(user.publicMetadata.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMessageUser(user.id)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </Shell>
  )
} 