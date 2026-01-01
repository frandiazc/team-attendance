import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttendanceData {
    [date: string]: number;
}

interface AttendanceCalendarProps {
    year: number;
    month: number;
    attendanceCounts: AttendanceData;
    totalPlayers: number;
    events: { event_date: string; type: string }[];
    onDateClick: (date: string) => void;
    onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function AttendanceCalendar({
    year,
    month,
    attendanceCounts,
    totalPlayers,
    events,
    onDateClick,
    onMonthChange,
}: AttendanceCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();

        // Get the day of week (0 = Sunday, adjust to Monday = 0)
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [year, month]);

    const eventsMap = useMemo(() => {
        const map: Record<string, string> = {};
        events.forEach(e => {
            map[e.event_date] = e.type;
        });
        return map;
    }, [events]);

    const handlePrevMonth = () => {
        if (month === 1) {
            onMonthChange(year - 1, 12);
        } else {
            onMonthChange(year, month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            onMonthChange(year + 1, 1);
        } else {
            onMonthChange(year, month + 1);
        }
    };

    const getDateString = (day: number) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getAttendancePercentage = (date: string) => {
        const count = attendanceCounts[date] || 0;
        return totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="hover:bg-primary/10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Button>

                <h3 className="text-xl font-bold text-foreground">
                    {MONTHS[month - 1]} {year}
                </h3>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="hover:bg-primary/10"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateStr = getDateString(day);
                    const hasEvent = eventsMap[dateStr];
                    const attendancePercent = getAttendancePercentage(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const count = attendanceCounts[dateStr] || 0;

                    return (
                        <motion.button
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setSelectedDate(dateStr);
                                onDateClick(dateStr);
                            }}
                            className={cn(
                                'relative aspect-square rounded-lg flex flex-col items-center justify-center',
                                'transition-all duration-200',
                                'hover:bg-primary/10',
                                isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                isSelected && 'bg-primary/20',
                                !hasEvent && 'opacity-50'
                            )}
                        >
                            {/* Day number */}
                            <span className={cn(
                                'text-sm font-medium',
                                isToday ? 'text-primary' : 'text-foreground'
                            )}>
                                {day}
                            </span>

                            {/* Event type indicator */}
                            {hasEvent && (
                                <div className={cn(
                                    'absolute top-1 right-1 w-2 h-2 rounded-full',
                                    hasEvent === 'match' ? 'bg-amber-500' : 'bg-blue-500'
                                )} />
                            )}

                            {/* Attendance indicator */}
                            {hasEvent && (
                                <div className="mt-1 w-full px-1">
                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${attendancePercent}%` }}
                                            className={cn(
                                                'h-full rounded-full',
                                                attendancePercent >= 80 ? 'bg-green-500' :
                                                    attendancePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Attendance count badge */}
                            {count > 0 && (
                                <span className="absolute bottom-0.5 text-[10px] text-muted-foreground">
                                    {count}/{totalPlayers}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Entrenamiento</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs text-muted-foreground">Partido</span>
                </div>
            </div>
        </div>
    );
}
