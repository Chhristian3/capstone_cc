"use client"

import { useEffect, useState } from "react"
import { useAppointments } from "@/contexts/AppointmentContext"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { DateStatus } from "@prisma/client"
import { QRCodeSVG } from "qrcode.react"

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface SelectedDate {
  id: string
  date: string
  status: DateStatus
  startTime: string | null
  endTime: string | null
  reason: string | null
}

type FormData = {
  title: string
  appointmentDate: string
  appointmentEndDate: string
  serviceTypeId: string
  description?: string
  referenceNumber?: string
}

function formSchema(selectedDates: SelectedDate[]): z.ZodType<FormData> {
  return z
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

      // Check against selected dates
      const selectedDate = selectedDates.find(
        (sd) => new Date(sd.date).toDateString() === start.toDateString()
      )

      if (selectedDate) {
        // If the date is disabled, prevent any appointments
        if (selectedDate.status === DateStatus.DISABLED) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "This date is disabled for appointments",
            path: ["appointmentDate"],
          })
        }

        // If the date has specific time constraints
        if (selectedDate.startTime && selectedDate.endTime) {
          const startTime = new Date(selectedDate.startTime)
          const endTime = new Date(selectedDate.endTime)

          // Check if appointment start time is within allowed range
          if (start < startTime || start > endTime) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Appointment must start between ${startTime.toLocaleTimeString()} and ${endTime.toLocaleTimeString()}`,
              path: ["appointmentDate"],
            })
          }

          // Check if appointment end time is within allowed range
          if (end < startTime || end > endTime) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Appointment must end between ${startTime.toLocaleTimeString()} and ${endTime.toLocaleTimeString()}`,
              path: ["appointmentEndDate"],
            })
          }
        }
      }
    }) as z.ZodType<FormData>
}

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
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentQRCode, setPaymentQRCode] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [bookedTimeSlots, setBookedTimeSlots] = useState<{start: Date, end: Date}[]>([])
  const { toast } = useToast()
  const { user } = useUser()
  const { addAppointment } = useAppointments()

  // Fetch selected dates
  useEffect(() => {
    const fetchSelectedDates = async () => {
      try {
        const response = await fetch("/api/settings/date")
        const data = await response.json()
        setSelectedDates(data)
      } catch (error) {
        console.error("Failed to fetch selected dates:", error)
      }
    }
    fetchSelectedDates()
  }, [])

  const schema = formSchema(selectedDates)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
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

  // Fetch booked appointments for the selected date
  useEffect(() => {
    const fetchBookedAppointments = async () => {
      if (startDate) {
        try {
          const date = new Date(startDate)
          const formattedDate = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
          const response = await fetch(`/api/appointments/date?date=${formattedDate}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch booked appointments')
          }
          
          const appointments = await response.json()
          
          // Convert appointments to time slots
          const timeSlots = appointments.map((app: any) => ({
            start: new Date(app.appointmentDate),
            end: new Date(app.appointmentEndDate)
          }))
          
          setBookedTimeSlots(timeSlots)
        } catch (error) {
          console.error('Error fetching booked appointments:', error)
        }
      } else {
        setBookedTimeSlots([])
      }
    }
    
    fetchBookedAppointments()
  }, [startDate])

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

  async function checkTimeConflict(data: FormData): Promise<boolean> {
    try {
      const response = await fetch('/api/appointments/check-conflict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: data.appointmentDate,
          endTime: data.appointmentEndDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check time conflict')
      }

      const { hasConflict } = await response.json()
      return hasConflict
    } catch (error) {
      console.error('Error checking time conflict:', error)
      return true // Assume conflict on error to be safe
    }
  }

  async function generatePaymentQRCode(data: FormData): Promise<string> {
    // In a real implementation, this would call your payment provider's API
    // For demo purposes, we'll generate a simple QR code with appointment details
    const paymentData = {
      appointmentId: 'pending',
      amount: '100', // This should come from your service type pricing
      currency: 'USD',
      customerName: user?.fullName || 'Unknown',
      appointmentDate: data.appointmentDate,
      serviceTypeId: data.serviceTypeId,
    }
    return JSON.stringify(paymentData)
  }

  async function confirmPayment(data: FormData, refNumber: string): Promise<boolean> {
    try {
      // In a real implementation, this would verify the payment with your payment provider
      // For demo purposes, we'll simulate a successful verification
      if (refNumber.length !== 4 || !/^\d+$/.test(refNumber)) {
        throw new Error('Please enter a valid 4-digit reference number')
      }

      // Simulate API call to verify payment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (error) {
      console.error('Payment verification failed:', error)
      return false
    }
  }

  async function onSubmit(data: FormData): Promise<void> {
    try {
      // Check for time conflicts
      const hasConflict = await checkTimeConflict(data)
      if (hasConflict) {
        toast({
          title: "Time Slot Conflict",
          description: "The selected time slot is already booked. Please choose a different time.",
          variant: "destructive",
        })
        return
      }

      // Generate payment QR code
      const paymentData = await generatePaymentQRCode(data)
      setPaymentQRCode(paymentData)
      setIsPaymentDialogOpen(true)
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
        const formattedStart = new Date(error.conflictData.start).toLocaleString();
        const formattedEnd = new Date(error.conflictData.end).toLocaleString();
        
        toast({
          title: "Time Slot Conflict",
          description: `Time slot already booked: ${formattedStart} - ${formattedEnd}`,
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

  async function handlePaymentConfirmation(data: FormData) {
    setIsConfirmingPayment(true)
    try {
      const isPaymentValid = await confirmPayment(data, referenceNumber)
      
      if (!isPaymentValid) {
        toast({
          title: "Payment Verification Failed",
          description: "Please check your reference number and try again.",
          variant: "destructive",
        })
        return
      }

      // @ts-ignore
      const appointment = await addAppointment({
        ...data,
        customerName: user?.fullName || "Unknown",
        expirationDate: new Date(
          new Date(data.appointmentEndDate).getTime() + 60 * 60 * 1000
        ).toISOString(),
        referenceNumber,
      })

      toast({
        title: "Appointment Created",
        description: (
          <div>
            <p>
              <strong>Title:</strong> {data.title}
            </p>
            <p>
              <strong>Start:</strong>{" "}
              {new Date(data.appointmentDate).toLocaleString()}
            </p>
            <p>
              <strong>End:</strong>{" "}
              {new Date(data.appointmentEndDate).toLocaleString()}
            </p>
            {data.description && (
              <p>
                <strong>Description:</strong> {data.description}
              </p>
            )}
          </div>
        ),
      })
      setIsPaymentDialogOpen(false)
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
        const formattedStart = new Date(error.conflictData.start).toLocaleString();
        const formattedEnd = new Date(error.conflictData.end).toLocaleString();
        
        toast({
          title: "Time Slot Conflict",
          description: `Time slot already booked: ${formattedStart} - ${formattedEnd}`,
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
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  return (
    <>
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
                    disabledDates={selectedDates
                      .filter((sd) => sd.status === DateStatus.DISABLED)
                      .map((sd) => new Date(sd.date))}
                    timeConstraints={(date) => {
                      const selectedDate = selectedDates.find(
                        (sd) => new Date(sd.date).toDateString() === date.toDateString()
                      )
                      if (selectedDate?.startTime && selectedDate?.endTime) {
                        return {
                          start: new Date(selectedDate.startTime),
                          end: new Date(selectedDate.endTime),
                        }
                      }
                      return undefined
                    }}
                    bookedTimeSlots={bookedTimeSlots}
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
                    disabledDates={selectedDates
                      .filter((sd) => sd.status === DateStatus.DISABLED)
                      .map((sd) => new Date(sd.date))}
                    timeConstraints={(date) => {
                      const selectedDate = selectedDates.find(
                        (sd) => new Date(sd.date).toDateString() === date.toDateString()
                      )
                      if (selectedDate?.startTime && selectedDate?.endTime) {
                        return {
                          start: new Date(selectedDate.startTime),
                          end: new Date(selectedDate.endTime),
                        }
                      }
                      return undefined
                    }}
                    bookedTimeSlots={bookedTimeSlots}
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

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Scan the QR code below to complete your payment
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeSVG value={paymentQRCode} size={200} />
            </div>
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference Number (Last 4 digits)</label>
                <Input
                  type="text"
                  maxLength={4}
                  value={referenceNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setReferenceNumber(value)
                  }}
                  placeholder="Enter last 4 digits"
                  className="w-full"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handlePaymentConfirmation(form.getValues())}
                disabled={referenceNumber.length !== 4 || isConfirmingPayment}
              >
                {isConfirmingPayment ? "Confirming..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
