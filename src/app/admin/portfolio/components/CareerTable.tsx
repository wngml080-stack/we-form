"use client";

interface CareerHistoryItem {
  period: string;
  content: string;
}

interface CareerTableProps {
  careerHistory: CareerHistoryItem[];
}

export function CareerTable({ careerHistory }: CareerTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 w-1/4">
              기간
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
              내용
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {careerHistory.map((item, index) => (
            <tr key={index} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-600">{item.period}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{item.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
