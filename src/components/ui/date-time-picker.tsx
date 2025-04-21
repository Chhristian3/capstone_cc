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

interface DateTimePickerProps {
  date?: Date;
  onSelect: (date: Date) => void;
  isEndDate?: boolean;
  disabledDates?: Date[];
  timeConstraints?: (date: Date) => TimeConstraints | undefined;
}

export function DateTimePicker({ 
  date, 
  onSelect, 
  isEndDate = false,
  disabledDates = [],
  timeConstraints
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i); // All hours in a day

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
          // Default behavior if no constraints
          if (newHour >= 8 && newHour <= 17) {
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

  const isHourDisabled = (hour: number, isPM: boolean) => {
    if (!date) return false;
    
    const constraints = timeConstraints?.(date);
    if (constraints) {
      const minHour = constraints.start.getHours();
      const maxHour = constraints.end.getHours();
      const hour24 = isPM ? (hour % 12) + 12 : hour % 12;
      return hour24 < minHour || hour24 > maxHour;
    }

    // Default behavior if no constraints
    if (isEndDate && hour === 8) {
      return true; // Always disable 8 AM for end date
    }
    if (isPM) {
      // Disable 8-11 AM in PM mode
      return hour >= 8 && hour <= 11;
    } else {
      // Disable 12-5 PM in AM mode
      return hour >= 12 && hour <= 17;
    }
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
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
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
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    type="button"
                    key={minute}
                    size="icon"
                    variant={
                      date && date.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {["AM", "PM"].map((ampm) => {
                  const currentHour = date?.getHours() ?? 0;
                  const isDisabled = date && (
                    (ampm === "AM" && currentHour >= 12 && currentHour < 8) ||
                    (ampm === "PM" && currentHour < 8)
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
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
