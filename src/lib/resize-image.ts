// 휴대폰 사진은 몇 MB씩 하니까, 올리기 전에 브라우저에서 줄여요.
// 긴 변을 최대 1600px로 맞추고 JPEG(품질 85%)로 바꿔요.
export async function resizeImage(file: File, maxSize = 1600): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("변환 실패"))), "image/jpeg", 0.85),
  );
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
