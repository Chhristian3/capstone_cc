"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/components/ui/date-time-picker"

type FormData = {
  title: string
  appointmentDate: string
  appointmentEndDate: string
  serviceTypeId: string
  description?: string
}

const formSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid date and time.",
    }),
    appointmentEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid end date and time.",
    }),
    serviceTypeId: z.string().min(1, {
      message: "Please select a service type.",
    }),
    description: z
      .string()
      .max(500, {
        message: "Description must not exceed 500 characters.",
      })
      .optional(),
  })
  .superRefine((data: FormData, ctx: z.RefinementCtx) => {
    const start = new Date(data.appointmentDate)
    const end = new Date(data.appointmentEndDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    maxDate.setHours(23, 59, 59, 999)

    if (start < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot create appointments in the past",
        path: ["appointmentDate"],
      })
    }

    if (start > maxDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot create appointments more than 30 days in advance",
        path: ["appointmentDate"],
      })
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["appointmentEndDate"],
      })
    }

    if (start.toDateString() !== end.toDateString()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Appointments must start and end on the same day",
        path: ["appointmentEndDate"],
      })
    }
  })

async function getServiceTypes() {
  const res = await fetch("/api/service-types")
  if (!res.ok) {
    throw new Error("Failed to fetch service types")
  }
  return res.json()
}

interface AddAppointmentFormProps {
  onSuccess: () => void
  selectedDate: Date | undefined
}

export function AddAppointmentForm({
  onSuccess,
  selectedDate,
}: AddAppointmentFormProps) {
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const { toast } = useToast()
  const { user } = useUser()
  const { addAppointment } = useAppointments()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      appointmentDate: selectedDate ? selectedDate.toISOString() : "",
      appointmentEndDate: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString() : "", // Default 1 hour duration
      serviceTypeId: "",
      description: "",
    },
  })

  // Watch for changes in appointmentDate to update appointmentEndDate
  const startDate = form.watch("appointmentDate")
  const endDate = form.watch("appointmentEndDate")

  useEffect(() => {
    if (startDate) {
      const startDateTime = new Date(startDate)
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // Default 1 hour duration
      form.setValue("appointmentEndDate", endDateTime.toISOString())
    }
  }, [startDate, form])

  useEffect(() => {
    if (endDate) {
      const endDateTime = new Date(endDate)
      const startDateTime = new Date(endDateTime.getTime() - 60 * 60 * 1000) // Default 1 hour before
      form.setValue("appointmentDate", startDateTime.toISOString())
    }
  }, [endDate, form])

  useEffect(() => {
    getServiceTypes().then(setServiceTypes).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const startDate = new Date(selectedDate)
      startDate.setHours(8, 0, 0, 0) // Set start time to 8 AM
      const endDate = new Date(selectedDate)
      endDate.setHours(9, 0, 0, 0) // Set end time to 9 AM
      form.setValue("appointmentDate", startDate.toISOString())
      form.setValue("appointmentEndDate", endDate.toISOString())
    }
  }, [selectedDate, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Validate the selected date is not disabled
      if (selectedDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const maxDate = new Date()
        maxDate.setDate(maxDate.getDate() + 30)
        maxDate.setHours(23, 59, 59, 999)

        if (selectedDate < today) {
          throw new Error("Cannot create appointments in the past. Please select a future date and time.")
        }
        if (selectedDate > maxDate) {
          throw new Error("Appointments can only be scheduled up to 30 days in advance")
        }
      }

      // @ts-ignore
      const appointment = await addAppointment({
        ...values,
        customerName: user?.fullName || "Unknown",
        expirationDate: new Date(
          new Date(values.appointmentEndDate).getTime() + 60 * 60 * 1000
        ).toISOString(),
      })

      toast({
        title: "Appointment Created",
        description: (
          <div>
            <p>
              <strong>Title:</strong> {values.title}
            </p>
            <p>
              <strong>Start:</strong>{" "}
              {new Date(values.appointmentDate).toLocaleString()}
            </p>
            <p>
              <strong>End:</strong>{" "}
              {new Date(values.appointmentEndDate).toLocaleString()}
            </p>
            {values.description && (
              <p>
                <strong>Description:</strong> {values.description}
              </p>
            )}
          </div>
        ),
      })
      onSuccess()
    } catch (error: any) {
      console.error("Appointment creation error:", error)
      
      // Parse the error response
      let errorMessage = "Failed to create appointment. Please try again."
      
      try {
        // If the error is a string, try to parse it as JSON
        if (typeof error === 'string') {
          const parsedError = JSON.parse(error)
          errorMessage = parsedError.error || errorMessage
        } 
        // If the error is an object with an error property
        else if (error.error) {
          errorMessage = error.error
        }
        // If the error is a Response object
        else if (error instanceof Response) {
          const errorData = await error.json()
          errorMessage = errorData.error || errorMessage
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError)
      }
      
      console.log("Error details:", {
        message: errorMessage,
        originalError: error
      })
      
      // Check if the error is a time slot conflict
      if (errorMessage.includes("Time slot conflict")) {
        toast({
          title: "Time Slot Conflict",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (errorMessage.includes("Unauthorized")) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create an appointment",
          variant: "destructive",
        })
      } else if (errorMessage.includes("service type")) {
        toast({
          title: "Service Type Error",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Creating Appointment",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter appointment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="appointmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date and Time</FormLabel>
              <FormControl>
                <DateTimePicker
                  date={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(date.toISOString())
                      // Update end date automatically
                      const endDate = new Date(date.getTime() + 60 * 60 * 1000) // 1 hour duration
                      form.setValue("appointmentEndDate", endDate.toISOString())
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="appointmentEndDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date and Time</FormLabel>
              <FormControl>
                <DateTimePicker
                  date={field.value ? new Date(field.value) : undefined}
                  isEndDate={true}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(date.toISOString())
                      // Update start date automatically
                      const startDate = new Date(date.getTime() - 60 * 60 * 1000) // 1 hour before
                      form.setValue("appointmentDate", startDate.toISOString())
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceTypes.map((serviceType) => (
                    <SelectItem key={serviceType.id} value={serviceType.id}>
                      {serviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter appointment description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}
