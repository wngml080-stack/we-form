"use client";

interface ProfileCardProps {
  name: string;
  gymType: string;
  career: string[];
  licenses: string[];
}

export function ProfileCard({
  name,
  gymType,
  career,
  licenses,
}: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="space-y-6">
          {/* 헤더 */}
          <div>
            <span className="inline-block px-3 py-1 bg-slate-800 text-white text-xs font-semibold rounded">
              {gymType}
            </span>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              {name} 트레이너
            </h2>
          </div>

          {/* Career 섹션 */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
              <span className="w-1 h-5 bg-orange-500 rounded-full mr-2"></span>
              career
            </h3>
            <ul className="space-y-1 text-sm text-slate-600">
              {career.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* License 섹션 */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
              <span className="w-1 h-5 bg-orange-500 rounded-full mr-2"></span>
              license
            </h3>
            <ul className="space-y-1 text-sm text-slate-600">
              {licenses.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
