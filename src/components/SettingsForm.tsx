"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import type { Settings } from "@/lib/types";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
      <section className="space-y-3 rounded-2xl bg-surface p-5">
        <h2 className="font-medium">🛠 점검 모드</h2>
        <p className="text-xs leading-relaxed text-neutral-500">
          켜면 모든 화면 맨 위에 안내 배너가 떠요. 공지를 올렸다 내리지 않아도 돼요.
        </p>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="maintenanceOn"
            defaultChecked={s.maintenance_on}
            className="size-4 !w-auto"
          />
          <span className="text-sm text-neutral-200">점검 모드 켜기</span>
        </label>
        <div>
          <label htmlFor="maintenanceText">배너 문구 (비우면 기본 문구)</label>
          <input
            id="maintenanceText"
            name="maintenanceText"
            defaultValue={s.maintenance_text ?? ""}
            placeholder="접속은 가능하지만 일부 기능이 원활하지 않을 수 있습니다."
            className="mt-1.5"
          />
        </div>
      </section>
  );
}

export function SettingsForm({ s }: { s: Settings }) {
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await saveSettings(fd);
          toast("설정을 저장했어요.");
          router.push("/admin");
        } catch (e) {
          toast((e as Error).message, "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      <Card title="학교 / 급식 (NEIS)">
        <div>
          <label htmlFor="classLabel">학급 이름</label>
          <input
            id="classLabel"
            name="classLabel"
            defaultValue={s.class_label}
            className="mt-1.5"
            placeholder="2학년 9반"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="atpt">시도교육청코드</label>
            <input
              id="atpt"
              name="atpt"
              defaultValue={s.neis_atpt_code}
              className="mt-1.5"
              placeholder="G10"
            />
          </div>
          <div>
            <label htmlFor="schoolCode">표준학교코드</label>
            <input
              id="schoolCode"
              name="schoolCode"
              defaultValue={s.neis_school_code}
              className="mt-1.5"
              placeholder="7430048"
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          NEIS 학교기본정보 API로 조회한 값이에요. 비워두면 급식이 표시되지 않아요.
        </p>
      </Card>

      <Card title="납부 계좌">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bank">은행</label>
            <input
              id="bank"
              name="bank"
              defaultValue={s.account_bank}
              className="mt-1.5"
              placeholder="카카오뱅크"
            />
          </div>
          <div>
            <label htmlFor="holder">예금주</label>
            <input
              id="holder"
              name="holder"
              defaultValue={s.account_holder}
              className="mt-1.5"
              placeholder="홍길동"
            />
          </div>
        </div>
        <div>
          <label htmlFor="accnum">계좌번호</label>
          <input
            id="accnum"
            name="number"
            defaultValue={s.account_number}
            className="mt-1.5"
            placeholder="3333-12-3456789"
          />
        </div>
      </Card>

      <Card title="벌금 금액 / 기한">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="late">지각 (건당)</label>
            <input
              id="late"
              name="late"
              type="number"
              min={0}
              step={100}
              defaultValue={s.late_fine_amount}
              className="mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="cleaning">청소 불참 (건당)</label>
            <input
              id="cleaning"
              name="cleaning"
              type="number"
              min={0}
              step={100}
              defaultValue={s.cleaning_fine_amount}
              className="mt-1.5"
            />
          </div>
        </div>
        <div>
          <label htmlFor="deadline">납부 기한 (일)</label>
          <input
            id="deadline"
            name="deadline"
            type="number"
            min={1}
            defaultValue={s.payment_deadline_days}
            className="mt-1.5"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            부과일로부터 며칠 안에 납부해야 하는지예요.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-3">
          <input
            type="checkbox"
            name="double"
            defaultChecked={s.double_fine_enabled}
            className="size-4 !w-auto"
          />
          <span className="text-sm text-neutral-200">기한 초과 시 7일마다 2배 (최대 4배)</span>
        </label>
      </Card>

      <button
        disabled={pending}
        className="h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "설정 저장"}
      </button>
    </form>
  );
}