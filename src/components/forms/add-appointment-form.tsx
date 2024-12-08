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
  .refine(
    (data) => {
      const start = new Date(data.appointmentDate)
      const end = new Date(data.appointmentEndDate)
      return end > start && start.toDateString() === end.toDateString()
    },
    {
      message: "End time must be after start time and on the same day",
      path: ["appointmentEndDate"],
    }
  )

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
  const { addAppointment } = useAppointments()
  const { user } = useUser()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      appointmentDate: "",
      appointmentEndDate: "",
      serviceTypeId: "",
      description: "",
    },
  })

  useEffect(() => {
    getServiceTypes().then(setServiceTypes).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const startDate = new Date(selectedDate)
      startDate.setHours(9, 0, 0, 0) // Set default start time to 9:00 AM
      const endDate = new Date(selectedDate)
      endDate.setHours(10, 0, 0, 0) // Set default end time to 10:00 AM
      form.setValue("appointmentDate", startDate.toISOString().slice(0, 16))
      form.setValue("appointmentEndDate", endDate.toISOString().slice(0, 16))
    }
  }, [selectedDate, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // @ts-ignore
      await addAppointment({
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
      console.error(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
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
                <Input type="datetime-local" {...field} />
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
                <Input type="datetime-local" {...field} />
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
