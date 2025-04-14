"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ServiceType {
  id: string
  name: string
  description: string
  averageRating: number
  totalAppointments: number
  completedAppointments: number
}

export default function ServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState<ServiceType | null>(null)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    async function fetchServiceTypes() {
      try {
        const response = await fetch("/api/service-types")
        if (!response.ok) throw new Error("Failed to fetch service types")
        const data = await response.json()
        setServiceTypes(data)
      } catch (error) {
        console.error("Error fetching service types:", error)
      }
    }

    fetchServiceTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingServiceType 
        ? `/api/service-types?id=${editingServiceType.id}`
        : "/api/service-types"
        
      const response = await fetch(url, {
        method: editingServiceType ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      })

      if (!response.ok) throw new Error("Failed to save service type")

      const data = await response.json()
      if (editingServiceType) {
        setServiceTypes(serviceTypes.map(st => st.id === data.id ? data : st))
      } else {
        setServiceTypes([...serviceTypes, data])
      }
      setIsDialogOpen(false)
      setFormData({ name: "", description: "" })
      setEditingServiceType(null)
    } catch (error) {
      console.error("Error saving service type:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/service-types?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete service type")

      setServiceTypes(serviceTypes.filter(st => st.id !== id))
      setIsDeleteDialogOpen(false)
      setServiceTypeToDelete(null)
    } catch (error) {
      console.error("Error deleting service type:", error)
    }
  }

  const handleEdit = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType)
    setFormData({
      name: serviceType.name,
      description: serviceType.description,
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (serviceType: ServiceType) => {
    setServiceTypeToDelete(serviceType)
    setIsDeleteDialogOpen(true)
  }

  const filteredServiceTypes = useMemo(() => {
    return serviceTypes.filter((serviceType) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        serviceType.name.toLowerCase().includes(searchLower) ||
        serviceType.description.toLowerCase().includes(searchLower)
      )
    })
  }, [serviceTypes, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Service Types</h2>
          <p className="text-muted-foreground">
            Manage the types of services offered by your business.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingServiceType ? "Edit Service Type" : "Add New Service Type"}
              </DialogTitle>
              <DialogDescription>
                {editingServiceType
                  ? "Update the service type details below."
                  : "Fill in the details for the new service type."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name">Name</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingServiceType ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search service types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold text-center">Appointments</TableHead>
              <TableHead className="font-semibold text-center">Completed</TableHead>
              <TableHead className="font-semibold text-center">Rating</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServiceTypes.map((serviceType) => (
              <TableRow key={serviceType.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{serviceType.name}</TableCell>
                <TableCell className="max-w-[300px] truncate">{serviceType.description}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{serviceType.totalAppointments}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{serviceType.completedAppointments}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {serviceType.completedAppointments > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-medium">{serviceType.averageRating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(serviceType.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No ratings</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(serviceType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(serviceType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{serviceTypeToDelete?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setServiceTypeToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => serviceTypeToDelete && handleDelete(serviceTypeToDelete.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 