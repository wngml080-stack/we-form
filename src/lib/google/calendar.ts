// Google Calendar API utilities

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: { email: string }[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

export interface CalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

// 캘린더 이벤트 생성
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<CalendarEventResponse> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create calendar event");
  }

  return response.json();
}

// 캘린더 이벤트 수정
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEventResponse> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update calendar event");
  }

  return response.json();
}

// 캘린더 이벤트 삭제
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete calendar event");
  }
}

// 캘린더 이벤트 목록 조회
export async function listCalendarEvents(
  accessToken: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
  } = {}
): Promise<CalendarEventResponse[]> {
  const params = new URLSearchParams();

  if (options.timeMin) params.append("timeMin", options.timeMin);
  if (options.timeMax) params.append("timeMax", options.timeMax);
  if (options.maxResults) params.append("maxResults", options.maxResults.toString());
  if (options.q) params.append("q", options.q);
  params.append("singleEvents", "true");
  params.append("orderBy", "startTime");

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to list calendar events");
  }

  const data = await response.json();
  return data.items || [];
}

// 예약 데이터를 캘린더 이벤트로 변환
export function reservationToCalendarEvent(
  reservation: {
    customer_name: string;
    customer_phone: string;
    reservation_type: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    notes?: string;
  },
  gymName?: string
): CalendarEvent {
  const typeLabels: Record<string, string> = {
    consultation: "상담",
    trial: "체험",
    ot: "OT",
    pt_consultation: "PT 상담",
    tour: "견학",
    other: "기타",
  };

  const typeLabel = typeLabels[reservation.reservation_type] || reservation.reservation_type;
  const summary = `[${typeLabel}] ${reservation.customer_name}`;

  // 시작 시간
  const startDateTime = new Date(`${reservation.scheduled_date}T${reservation.scheduled_time}`);
  // 종료 시간
  const endDateTime = new Date(startDateTime.getTime() + reservation.duration_minutes * 60 * 1000);

  const description = [
    `예약자: ${reservation.customer_name}`,
    `연락처: ${reservation.customer_phone}`,
    `유형: ${typeLabel}`,
    reservation.notes ? `메모: ${reservation.notes}` : "",
    gymName ? `지점: ${gymName}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary,
    description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: "Asia/Seoul",
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: "Asia/Seoul",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}
