export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  durationMinutes?: number | null;
  /** Minutes before the start to fire a reminder alarm; omit for no alarm. */
  reminderMinutes?: number | null;
};

function toIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(event: CalendarEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Circle by MyFlip//Club Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@circle.myflip`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);

  if (event.reminderMinutes && event.reminderMinutes > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(`Reminder: ${event.title}`)}`,
      `TRIGGER:-PT${Math.round(event.reminderMinutes)}M`,
      "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(event: CalendarEvent) {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "circle-event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    details: event.description ?? "",
    location: event.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
