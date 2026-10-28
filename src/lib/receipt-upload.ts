import type { SupabaseClient } from "@supabase/supabase-js";

// 관리자 브라우저(크롬)가 그대로 보여줄 수 있는 형식만 원본으로 올린다.
const VIEWABLE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * 업로드할 파일과 확장자를 정한다.
 * HEIC 등은 크롬에서 안 보이므로 JPEG 로 바꿔 올린다. (사파리는 HEIC 를 디코딩할 수 있다)
 * 디코딩이 안 되는 브라우저면 다른 형식으로 올려 달라고 안내한다.
 */
async function toUploadable(file: File): Promise<{ blob: Blob; ext: string }> {
  const ext = VIEWABLE[file.type];
  if (ext) return { blob: file, ext };

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob) throw new Error();
    return { blob, ext: "jpg" };
  } catch {
    throw new Error("이 사진 형식은 올릴 수 없어요. 스크린샷(JPG·PNG)으로 올려주세요.");
  }
}

/**
 * 입금 내역 스크린샷을 receipts 저장소의 본인 폴더({uid}/…)에 올리고 경로를 돌려준다.
 * 원래 파일명은 쓰지 않는다. 한글 등이 들어가면 Storage 가 "Invalid key" 로 거부한다.
 */
export async function uploadReceipt(supabase: SupabaseClient, file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 만료됐어요. 새로고침 해주세요.");

  const { blob, ext } = await toUploadable(file);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage
    .from("receipts")
    .upload(path, blob, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}` });
  if (up.error) throw new Error("사진 업로드 실패: " + up.error.message);
  return path;
}
