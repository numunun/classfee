import { TermsBody } from "@/components/TermsBody";
import { TermsBodyPrev } from "@/components/TermsBodyPrev";
import { NEXT_TERMS_VERSION } from "@/lib/terms";

/** 판(버전)에 맞는 약관 본문을 그린다 */
export function TermsByVersion({ version }: { version: string }) {
  return version === NEXT_TERMS_VERSION ? <TermsBody /> : <TermsBodyPrev />;
}
