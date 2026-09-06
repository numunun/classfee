/**
 * 약관 본문. 동의 화면과 전문 페이지가 같은 내용을 쓰도록 한 곳에 둔다.
 */
export function TermsBody() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-neutral-300">
      <div>
        <h1 className="text-lg font-bold text-neutral-100">
          이용약관 및 개인정보 처리방침
        </h1>
        <p className="mt-1 text-xs text-neutral-500">발효일 2026년 9월 7일</p>
      </div>

      <Section n="제1조" title="목적">
        본 약관은 대전대신고등학교 2학년 9반 학급 관리 서비스(이하 &quot;<b className="text-neutral-100">서비스</b>&quot;)의 이용
        조건 및 절차, 이용자와 운영자의 권리·의무 및 개인정보 처리에 관한 사항을 규정하는 것을
        목적으로 합니다.
      </Section>

      <Section n="제2조" title="정의">
        <p>본 약관에서 사용하는 용어의 뜻은 다음과 같습니다.</p>
        <ol className="mt-2 space-y-1.5 text-neutral-400">
          <li>
            1. <b className="text-neutral-100">서비스</b>란 운영자가 제공하는 학급 관리 웹
            애플리케이션 및 이에 부수하는 일체의 기능을 말합니다.
          </li>
          <li>
            2. <b className="text-neutral-100">이용자</b>란 본 약관에 동의하고 서비스를
            이용하는 2학년 9반 구성원 및 담당 교사를 말합니다.
          </li>
          <li>
            3. <b className="text-neutral-100">관리자</b>란 서비스 내 관리 권한을 부여받은
            사람으로서, 담당 교사와 반장·부반장·법무부장을 말합니다.
          </li>
          <li>
            4. <b className="text-neutral-100">벌금</b>이란 학급 규정에 따라 이용자에게 부과되는
            금전적 부담을 말합니다.
          </li>
          <li>
            5. <b className="text-neutral-100">CIP</b>란 학교가 운영하는 야간자율학습을 말하며,
            1차·2차·3차로 구분합니다.
          </li>
          <li>
            6. <b className="text-neutral-100">현황판</b>이란 교실 내 전자칠판에 표시되는 CIP
            출결 화면을 말합니다.
          </li>
        </ol>
      </Section>

      <Section n="제3조" title="서비스의 성격">
        <p>
          ① 서비스는 학급의 벌금 회계, CIP 출결, 급식 정보 조회, 학급 공지 전달을 위하여
          제공됩니다.
        </p>
        <p className="mt-2">
          ② <b className="text-neutral-100">서비스는 학교의 공식 시스템이 아니며</b>, 학급
          구성원이 자율적으로 개발·운영합니다. 학교 및 교육청은 서비스의 운영과 그 결과에
          대하여 어떠한 책임도 부담하지 않습니다.
        </p>
      </Section>

      <Section n="제4조" title="운영자">
        <p>① 운영자는 성우열, 김예찬, 전은찬, 황성재로 합니다.</p>
        <p className="mt-2">② 서비스에 관한 문의는 운영자에게 직접 접수합니다.</p>
      </Section>

      <Section n="제5조" title="이용 자격">
        <p>① 서비스는 2학년 9반 구성원 및 담당 교사만 이용할 수 있습니다.</p>
        <p className="mt-2">
          ② 로그인은 학교에서 발급한 구글 계정(<b className="text-neutral-100">@dshs.kr</b>)으로만 가능하며, 그 외의 계정으로는
          접속할 수 없습니다.
        </p>
        <p className="mt-2">
          ③ 최초 이용 시 이용자는 본인의 성명과 학번을 등록하여야 합니다.
        </p>
      </Section>

      <Section n="제6조" title="수집하는 개인정보">
        <p>① 서비스는 다음의 정보를 수집합니다.</p>
        <ul className="mt-2 space-y-1 text-neutral-400">
          <li>· 성명, 학번 — 최초 로그인 시 본인 입력</li>
          <li>· 학교 구글 이메일 — 로그인 시 자동 수집</li>
          <li>· 벌금 부과 및 납부 내역</li>
          <li>· CIP 출결 및 불참 사유</li>
          <li>· 입금 완료 화면 이미지</li>
        </ul>
        <p className="mt-2">
          ② 주민등록번호, 연락처, 주소 등 제1항에 열거되지 않은 정보는 수집하지 않습니다.
        </p>
        <p className="mt-2">
          ③{" "}
          <b className="text-neutral-100">
            입금 완료 화면 이미지에는 계좌번호, 잔액 등이 함께 촬영될 수 있습니다.
          </b>{" "}
          해당 이미지는 관리자 및 본인 외에는 열람할 수 없습니다.
        </p>
      </Section>

      <Section n="제7조" title="개인정보의 열람 범위">
        <p>① 이용자 본인은 자신에 관한 모든 기록을 열람할 수 있습니다.</p>
        <p className="mt-2">
          ② 관리자는 학급 운영에 필요한 범위에서 전체 구성원의 벌금·출결·입금 기록을 열람할 수
          있습니다.
        </p>
        <p className="mt-2">
          ③ 현황판에는 성명, 번호, 당일 CIP 참석 여부 및 사유가 표시되며, 로그인 없이 교실
          내에서 열람할 수 있습니다. 벌금에 관한 정보는 표시되지 않습니다.
        </p>
        <p className="mt-2">
          ④ 운영자는 이용자의 개인정보를 제3자에게 제공하거나 학급 외부로 반출하지 않습니다.
        </p>
      </Section>

      <Section n="제8조" title="개인정보의 보유 및 파기">
        <p>
          ① 개인정보는 <b className="text-neutral-100">2026학년도 종료 시까지</b> 보유하며,
          학년이 변경되는 시점에 일괄 파기합니다.
        </p>
        <p className="mt-2">
          ② 이용자는 언제든지 자신의 개인정보 삭제를 요청할 수 있습니다. 다만 미납 벌금이 있는
          경우에는 해당 회계 처리가 끝난 후 파기합니다.
        </p>
      </Section>

      <Section n="제9조" title="벌금에 관한 사항">
        <p>
          ① 서비스는 학급 규정에 따라 부과된 벌금을{" "}
          <b className="text-neutral-100">기록·관리하는 도구</b>이며, 벌금 부과의 근거는 학급
          회의에서 의결한 학급 규정에 있습니다.
        </p>
        <p className="mt-2">
          ② 부과 기준, 금액, 납부 기한에 관한 이의는 학급 회의 또는 관리자에게 제기하여야
          합니다.
        </p>
        <p className="mt-2">
          ③ 징수된 벌금은 학급 공동 경비로 사용하며, 사용 내역은 관리자가 별도로 공개합니다.
        </p>
      </Section>

      <Section n="제10조" title="이용자의 의무">
        <p>① 이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
        <ol className="mt-2 space-y-1 text-neutral-400">
          <li>1. 타인의 계정으로 로그인하거나 이를 시도하는 행위</li>
          <li>2. CIP 불참 사유를 허위로 신고하는 행위</li>
          <li>3. 입금 완료 화면 이미지를 위조·변조하여 제출하는 행위</li>
          <li>4. 서비스의 취약점을 이용하여 기록을 무단으로 변경하려는 행위</li>
          <li>5. 서비스를 통하여 알게 된 타인의 정보를 학급 외부에 유출하는 행위</li>
        </ol>
        <p className="mt-2">
          ② <b className="text-neutral-100">이용자는 서비스에 저장된 기록 중 본인에게 중요한 것을 별도로 보관하여야 합니다.</b>
        </p>
      </Section>

      <Section n="제11조" title="이용 제한">
        전조를 위반한 이용자에 대하여 운영자는 서비스 이용을 제한할 수 있습니다.
      </Section>

      <Section n="제12조" title="면책">
        <p>
          ① 운영자는 서비스의 안정적인 운영을 위하여 노력합니다. 다만 서비스는 개인이 무상으로
          운영하는 것이므로, 운영자는 다음 각 호를 보장하지 않습니다.
        </p>
        <ol className="mt-2 space-y-1 text-neutral-400">
          <li>1. 서비스의 중단 없는 제공</li>
          <li>2. 저장된 데이터의 무결성 및 무손실</li>
          <li>3. 외부 시스템으로부터 제공받는 정보(급식 정보 등)의 정확성</li>
        </ol>
        <p className="mt-2">
          ② 운영자는 천재지변, 정전, 서비스가 이용하는 외부 시스템의 장애 등 운영자의 책임 없는
          사유로 발생한 손해에 대하여 책임을 지지 않습니다.
        </p>
        <p className="mt-2">
          ③ 이용자가 허위로 입력하여 발생한 문제에 대하여 운영자는 책임을 지지 않습니다.
        </p>
      </Section>

      <Section n="제13조" title="약관의 변경">
        <p>① 운영자는 필요한 경우 본 약관을 변경할 수 있습니다.</p>
        <p className="mt-2">② 약관을 변경하는 경우 서비스 내 공지를 통하여 알립니다.</p>
        <p className="mt-2">
          ③ 변경된 약관의 공지 후에도 이용자가 서비스를 계속 이용하는 경우, 변경 사항에 동의한
          것으로 봅니다.
        </p>
      </Section>

      <p className="border-t border-line pt-4 text-xs text-neutral-500">
        부칙 · 본 약관은 2026년 9월 7일부터 시행합니다.
      </p>
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1.5 font-semibold text-neutral-100">
        {n} ({title})
      </h2>
      <div>{children}</div>
    </section>
  );
}