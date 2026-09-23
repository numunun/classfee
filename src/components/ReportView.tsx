"use client";

import { useState } from "react";
import { payable, won, FINE_TYPE_LABEL, type FineType, type FineStatus } from "@/lib/types";


export type ReportRow = {
  id: string;
  type: FineType;
  amount: number;
  status: FineStatus;
  reason: string | null;
  occurred_date: string;
  overdue_multiplier?: number;
  students: { name: string; student_number: number | null } | null;
};

function ko(d: string) {
  const dt = new Date(d + "T00:00:00+09:00");
  return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}.`;
}

function shortKo(d: string) {
  const dt = new Date(d + "T00:00:00+09:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

export function ReportView({
  rows,
  from,
  to,
  classLabel,
}: {
  rows: ReportRow[];
  from: string;
  to: string;
  classLabel: string;
}) {
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  const total = rows.reduce((a, r) => a + payable(r), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((a, r) => a + payable(r), 0);
  const unpaid = rows
    .filter((r) => ["unpaid", "doubled", "pending_approval"].includes(r.status))
    .reduce((a, r) => a + payable(r), 0);

  // 학생별 요약
  const byStudent = new Map<
    string,
    { name: string; number: number | null; count: number; paid: number; unpaid: number }
  >();
  for (const r of rows) {
    const name = r.students?.name ?? "?";
    const cur = byStudent.get(name) ?? {
      name,
      number: r.students?.student_number ?? null,
      count: 0,
      paid: 0,
      unpaid: 0,
    };
    cur.count += 1;
    if (r.status === "paid") cur.paid += payable(r);
    else cur.unpaid += payable(r);
    byStudent.set(name, cur);
  }
  const summary = Array.from(byStudent.values()).sort(
    (a, b) => (a.number ?? 9999) - (b.number ?? 9999)
  );

  function apply() {
    window.location.href = `/admin/report?from=${f}&to=${t}`;
  }

  return (
    <>
      {/* ---- 조작부 (인쇄 시 숨김) ---- */}
      <div className="no-print mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4">
        <div>
          <label htmlFor="from">시작일</label>
          <input id="from" type="date" value={f} onChange={(e) => setF(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <label htmlFor="to">종료일</label>
          <input id="to" type="date" value={t} onChange={(e) => setT(e.target.value)} className="mt-1.5" />
        </div>
        <button
          onClick={apply}
          className="h-[2.875rem] rounded-xl bg-surface-2 px-5 text-sm font-medium text-neutral-200"
        >
          기간 적용
        </button>
        <button
          onClick={() => window.print()}
          className="h-[2.875rem] rounded-xl px-5 text-sm font-bold"
          style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
        >
          PDF로 저장
        </button>
      </div>

      {/* ---- 보고서 본문 ---- */}
      <div className="report">
        <header className="mb-6 border-b border-line pb-4">
          <h1 className="text-xl font-bold">{classLabel} 벌금 회계 보고서</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {ko(from)} ~ {ko(to)} · 취소된 건 제외
          </p>
        </header>

        <section className="mb-6 grid grid-cols-3 gap-3">
          <Box label="총 부과액" value={won(total)} />
          <Box label="납부 완료액" value={won(paid)} />
          <Box label="미납액" value={won(unpaid)} />
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">학생별 요약</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-neutral-500">
                <th className="py-2">번호</th>
                <th>이름</th>
                <th className="text-right">건수</th>
                <th className="text-right">납부</th>
                <th className="text-right">미납</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.name} className="border-b border-line/60">
                  <td className="py-1.5 text-neutral-500">{s.number ? s.number % 100 : "-"}</td>
                  <td>{s.name}</td>
                  <td className="text-right tabular-nums">{s.count}</td>
                  <td className="text-right tabular-nums">{won(s.paid)}</td>
                  <td className="text-right font-semibold tabular-nums">
                    {s.unpaid ? won(s.unpaid) : "-"}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    해당 기간에 벌금이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">전체 벌금 내역 ({rows.length}건)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-neutral-500">
                <th className="py-2">날짜</th>
                <th>이름</th>
                <th>종류</th>
                <th>사유</th>
                <th className="text-right">금액</th>
                <th className="text-right">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const label = FINE_TYPE_LABEL[r.type];
                const note = r.reason && r.reason !== label ? r.reason : "";
                return (
                  <tr key={r.id} className="border-b border-line/60">
                    <td className="py-1.5 text-neutral-500">{shortKo(r.occurred_date)}</td>
                    <td>{r.students?.name}</td>
                    <td>{label}</td>
                    <td className="text-neutral-500">{note}</td>
                    <td className="text-right tabular-nums">{won(payable(r))}</td>
                    <td className="text-right">
                      {r.status === "paid"
                        ? "완납"
                        : r.status === "pending_approval"
                        ? "확인 중"
                        : "미납"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 border-t border-line pt-3 text-xs text-neutral-500">
          {classLabel} · 출력일 {ko(new Date().toISOString().slice(0, 10))}
        </footer>
      </div>
    </>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}