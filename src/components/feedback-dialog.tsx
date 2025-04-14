"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAppointments } from "@/contexts/AppointmentContext"

type RatingValue = "VeryDissatisfied" | "Dissatisfied" | "Neutral" | "Satisfied" | "VerySatisfied"

const ratingMap: Record<number, RatingValue> = {
  1: "VeryDissatisfied",
  2: "Dissatisfied",
  3: "Neutral",
  4: "Satisfied",
  5: "VerySatisfied",
}

interface FeedbackDialogProps {
  appointmentId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ appointmentId, isOpen, onOpenChange }: FeedbackDialogProps) {
  const { userAppointments, updateAppointment } = useAppointments()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          ratingValue: ratingMap[rating],
          comment: comment || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit feedback")
      }

      const data = await response.json()
      
      // Find the appointment in the current list
      const appointment = userAppointments.find(a => a.id === appointmentId)
      if (appointment) {
        // Update the appointment with the new rating
        await updateAppointment({
          ...appointment,
          rating: {
            ratingValue: ratingMap[rating],
            comment: comment || undefined
          }
        })
      }

      toast.success("Feedback submitted successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogDescription>
            How was your experience with this appointment?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Very Dissatisfied</span>
            <span>Very Satisfied</span>
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 