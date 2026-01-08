import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, List } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllFutureSchedules, ScheduleWithMinistry } from "@/hooks/useScheduleData";
import { useChurch } from "@/hooks/useChurch";
import { cn } from "@/lib/utils";

interface ScheduleCalendarProps {
  onSelectSchedule: (schedule: ScheduleWithMinistry) => void;
}

const ScheduleCalendar = ({ onSelectSchedule }: ScheduleCalendarProps) => {
  const { churchId } = useChurch();
  const { data: schedules, isLoading } = useAllFutureSchedules(churchId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const schedulesByDate = schedules?.reduce((acc, schedule) => {
    const dateKey = schedule.event_date; // YYYY-MM-DD
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleWithMinistry[]>) || {};

  // Modifiers para destacar datas com escalas
  const modifiers = {
    hasSchedule: schedules
      ? schedules.map(s => new Date(s.event_date + 'T00:00:00'))
      : [],
  };

  // Estilos para os modificadores (usando classes Tailwind para melhor integração)
  // Nota: O componente Calendar do shadcn/ui usa CSS Modules ou variáveis CSS para modifiersStyles.
  
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const eventsForSelectedDate = selectedDateKey ? schedulesByDate[selectedDateKey] || [] : [];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar View (2/3 width on large screens) */}
      <Card className="p-6 lg:col-span-2 shadow-elevated">
        <h3 className="text-xl font-bold mb-4 text-foreground">Calendário de Escalas</h3>
        <div className="w-full flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="w-full p-0"
            modifiers={modifiers}
            // Customização do estilo dos dias com eventos via classes CSS
            classNames={{
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              day_outside: "text-muted-foreground opacity-50",
              day_hasSchedule: "bg-secondary/80 text-secondary-foreground font-bold hover:bg-secondary/90",
            }}
          />
        </div>
      </Card>

      {/* Events List for Selected Date (1/3 width on large screens) */}
      <Card className="p-6 lg:col-span-1 shadow-elevated">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
          <Clock className="w-5 h-5" />
          Escalas em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Nenhuma Data Selecionada'}
        </h3>
        
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : eventsForSelectedDate.length > 0 ? (
            <div className="space-y-3">
              {eventsForSelectedDate.sort((a, b) => a.event_time.localeCompare(b.event_time)).map((schedule) => (
                <div 
                  key={schedule.id} 
                  className="p-4 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors shadow-sm"
                  onClick={() => onSelectSchedule(schedule)}
                >
                  <p className="font-medium text-base truncate">{schedule.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.event_time.substring(0, 5)}
                    </span>
                    <span className="px-3 py-0.5 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {schedule.ministries?.name || 'Ministério'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Nenhuma escala agendada para esta data.</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default ScheduleCalendar;
