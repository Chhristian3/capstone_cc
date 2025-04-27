"use client";

import * as React from "react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarIcon } from "lucide-react";

interface TimeConstraints {
  start: Date;
  end: Date;
}

interface BookedTimeSlot {
  start: Date;
  end: Date;
}

interface DateTimePickerProps {
  date?: Date;
  onSelect: (date: Date) => void;
  isEndDate?: boolean;
  disabledDates?: Date[];
  timeConstraints?: (date: Date) => TimeConstraints | undefined;
  bookedTimeSlots?: BookedTimeSlot[];
}

export function DateTimePicker({ 
  date, 
  onSelect, 
  isEndDate = false,
  disabledDates = [],
  timeConstraints,
  bookedTimeSlots = []
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Default business hours: 8 AM to 5 PM
  const BUSINESS_HOURS_START = 8;
  const BUSINESS_HOURS_END = 17;

  const hours = Array.from({ length: BUSINESS_HOURS_END - BUSINESS_HOURS_START + 1 }, (_, i) => i + BUSINESS_HOURS_START); // Only business hours

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);

    // Check if date is in disabledDates array
    const isInDisabledDates = disabledDates.some(
      (disabledDate) => disabledDate.toDateString() === date.toDateString()
    );

    return date < today || date > maxDate || isInDisabledDates;
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && !isDateDisabled(selectedDate)) {
      // Get time constraints for the selected date
      const constraints = timeConstraints?.(selectedDate);
      
      if (constraints) {
        // Set initial time to the start of the allowed time range
        selectedDate.setHours(
          constraints.start.getHours(),
          constraints.start.getMinutes(),
          0,
          0
        );
      } else {
        // Default to 8 AM for start date, 9 AM for end date if no constraints
        selectedDate.setHours(isEndDate ? 9 : 8, 0, 0, 0);
      }
      
      onSelect(selectedDate);
    }
  };

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    value: string
  ) => {
    if (date) {
      const newDate = new Date(date);
      const constraints = timeConstraints?.(newDate);
      
      if (type === "hour") {
        const hour = parseInt(value);
        const isPM = newDate.getHours() >= 12;
        // Convert to 24-hour format while maintaining AM/PM
        const newHour = isPM ? (hour % 12) + 12 : hour % 12;
        
        if (constraints) {
          // Ensure hour is within constraints
          const minHour = constraints.start.getHours();
          const maxHour = constraints.end.getHours();
          if (newHour >= minHour && newHour <= maxHour) {
            newDate.setHours(newHour);
          }
        } else {
          // Default behavior if no constraints - restrict to business hours
          if (newHour >= BUSINESS_HOURS_START && newHour <= BUSINESS_HOURS_END) {
            newDate.setHours(newHour);
          }
        }
      } else if (type === "minute") {
        const minute = parseInt(value);
        if (constraints) {
          // Ensure minute is within constraints
          const minMinute = constraints.start.getMinutes();
          const maxMinute = constraints.end.getMinutes();
          if (minute >= minMinute && minute <= maxMinute) {
            newDate.setMinutes(minute);
          }
        } else {
          newDate.setMinutes(minute);
        }
      } else if (type === "ampm") {
        const currentHours = newDate.getHours();
        if (value === "PM") {
          // Set to 12 PM when switching to PM
          newDate.setHours(12);
        } else {
          // Keep the same hour when switching to AM, just ensure it's in AM
          const amHour = currentHours >= 12 ? currentHours - 12 : currentHours;
          newDate.setHours(amHour);
        }
      }
      onSelect(newDate);
    }
  };

  const isTimeSlotBooked = (hour: number, minute: number) => {
    if (!date) return false;
    
    const testTime = new Date(date);
    testTime.setHours(hour, minute, 0, 0);
    
    // Check if this time slot conflicts with any booked time slots
    return bookedTimeSlots.some(slot => {
      return testTime >= slot.start && testTime < slot.end;
    });
  };

  const isHourDisabled = (hour: number, isPM: boolean) => {
    if (!date) return false;
    
    const constraints = timeConstraints?.(date);
    if (constraints) {
      const minHour = constraints.start.getHours();
      const maxHour = constraints.end.getHours();
      const hour24 = isPM ? (hour % 12) + 12 : hour % 12;
      return hour24 < minHour || hour24 > maxHour;
    }

    // Default behavior if no constraints - restrict to business hours
    const hour24 = isPM ? (hour % 12) + 12 : hour % 12;
    
    // Disable hours outside business hours (8 AM to 5 PM)
    if (hour24 < BUSINESS_HOURS_START || hour24 > BUSINESS_HOURS_END) {
      return true;
    }
    
    // For end date, disable hours that would make the appointment end before it starts
    if (isEndDate && date) {
      const startHour = date.getHours();
      if (hour24 <= startHour) {
        return true;
      }
    }
    
    return false;
  };

  const isMinuteDisabled = (minute: number) => {
    if (!date) return false;
    
    const hour = date.getHours();
    
    // Check if this specific minute is booked
    return isTimeSlotBooked(hour, minute);
  };

  const getDisplayHour = (hour: number) => {
    return hour % 12 || 12;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "MM/dd/yyyy hh:mm aa")
          ) : (
            <span>MM/DD/YYYY hh:mm aa</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            disabled={isDateDisabled}
          />
          <ScrollArea className="h-[304px] w-12 sm:w-auto ml-4 mt-2">
            <div className="flex flex-col">
              {hours.map((hour) => {
                const isPM = date ? date.getHours() >= 12 : false;
                const isDisabled = isHourDisabled(hour, isPM);
                return (
                  <Button
                    type="button"
                    key={hour}
                    size="icon"
                    variant={
                      date && date.getHours() === hour
                        ? "default"
                        : "ghost"
                    }
                    className={cn(
                      "sm:w-full shrink-0 aspect-square",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && handleTimeChange("hour", hour.toString())}
                    disabled={isDisabled}
                  >
                    {getDisplayHour(hour)}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
          <ScrollArea className="h-[304px] w-12 sm:w-auto mt-2">
            <div className="flex flex-col">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
                const isDisabled = isMinuteDisabled(minute);
                return (
                  <Button
                    type="button"
                    key={minute}
                    size="icon"
                    variant={
                      date && date.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className={cn(
                      "sm:w-full shrink-0 aspect-square",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && handleTimeChange("minute", minute.toString())}
                    disabled={isDisabled}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
          <ScrollArea className="h-[304px] w-12 sm:w-auto mt-2">
            <div className="flex flex-col">
              {["AM", "PM"].map((ampm) => {
                const currentHour = date?.getHours() ?? 0;
                const isDisabled = date && (
                  (ampm === "AM" && currentHour >= 12 && currentHour < BUSINESS_HOURS_START) ||
                  (ampm === "PM" && currentHour < BUSINESS_HOURS_START)
                );
                return (
                  <Button
                    type="button"
                    key={ampm}
                    size="icon"
                    variant={
                      date &&
                      ((ampm === "AM" && currentHour < 12) ||
                        (ampm === "PM" && currentHour >= 12))
                        ? "default"
                        : "ghost"
                    }
                    className={cn(
                      "sm:w-full shrink-0 aspect-square",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && handleTimeChange("ampm", ampm)}
                    disabled={isDisabled}
                  >
                    {ampm}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
