"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimelineWeekPickerProps {
  selectedWeekStart: Date;
  onWeekSelect: (weekStart: Date) => void;
}

export function TimelineWeekPicker({
  selectedWeekStart,
  onWeekSelect,
}: TimelineWeekPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 gap-1.5 text-xs sm:text-sm">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          {format(selectedWeekStart, "'Sem.' dd/MM", { locale: fr })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <Calendar
          mode="single"
          selected={selectedWeekStart}
          onSelect={(date) => {
            if (!date) return;
            onWeekSelect(startOfWeek(date, { weekStartsOn: 1 }));
            setOpen(false);
          }}
          weekStartsOn={1}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}
