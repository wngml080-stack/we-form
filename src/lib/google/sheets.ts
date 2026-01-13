// Google Sheets API 유틸리티

interface SheetData {
  title: string;
  headers: string[];
  rows: (string | number | null)[][];
}

// 새 스프레드시트 생성
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheets: SheetData[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: sheets.map((sheet, index) => ({
        properties: {
          sheetId: index,
          title: sheet.title,
        },
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create spreadsheet");
  }

  const data = await response.json();

  // 각 시트에 데이터 입력
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const values = [sheet.headers, ...sheet.rows];

    await updateSheetValues(
      accessToken,
      data.spreadsheetId,
      `${sheet.title}!A1`,
      values
    );
  }

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

// 시트에 데이터 입력
export async function updateSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update sheet values");
  }
}

// 회원 데이터를 시트 형식으로 변환
export function formatMembersForSheet(
  members: Array<{
    name: string;
    phone?: string;
    gender?: string;
    birth_date?: string;
    membership_type?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    trainer_name?: string;
  }>
): SheetData {
  return {
    title: "회원 목록",
    headers: [
      "이름",
      "연락처",
      "성별",
      "생년월일",
      "회원권 종류",
      "시작일",
      "종료일",
      "상태",
      "담당 트레이너",
    ],
    rows: members.map((m) => [
      m.name,
      m.phone || "",
      m.gender || "",
      m.birth_date || "",
      m.membership_type || "",
      m.start_date || "",
      m.end_date || "",
      m.status || "",
      m.trainer_name || "",
    ]),
  };
}

// 매출 데이터를 시트 형식으로 변환
export function formatSalesForSheet(
  sales: Array<{
    date: string;
    member_name: string;
    product_name: string;
    amount: number;
    payment_method?: string;
    staff_name?: string;
  }>
): SheetData {
  return {
    title: "매출 내역",
    headers: ["날짜", "회원명", "상품명", "금액", "결제방법", "담당자"],
    rows: sales.map((s) => [
      s.date,
      s.member_name,
      s.product_name,
      s.amount,
      s.payment_method || "",
      s.staff_name || "",
    ]),
  };
}

// 일정 데이터를 시트 형식으로 변환
export function formatSchedulesForSheet(
  schedules: Array<{
    date: string;
    time: string;
    member_name: string;
    trainer_name: string;
    lesson_type: string;
    status: string;
  }>
): SheetData {
  return {
    title: "수업 일정",
    headers: ["날짜", "시간", "회원명", "트레이너", "수업 종류", "상태"],
    rows: schedules.map((s) => [
      s.date,
      s.time,
      s.member_name,
      s.trainer_name,
      s.lesson_type,
      s.status,
    ]),
  };
}
