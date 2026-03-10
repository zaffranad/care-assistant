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
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {format(selectedWeekStart, "'Semaine du' dd/MM/yyyy", { locale: fr })}
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
