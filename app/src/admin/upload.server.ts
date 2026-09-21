import { imageSize } from "image-size";
import { ApiError } from "./http.server";
export function verifyImage(bytes: Uint8Array, mime: string) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024)
    throw new ApiError(413, "Escolha uma imagem até 5 MB.");
  let kind = "";
  const ascii = (a: number, b: number) => new TextDecoder().decode(bytes.slice(a, b));
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) kind = "jpg";
  else if ([137, 80, 78, 71, 13, 10, 26, 10].every((x, i) => bytes[i] === x)) kind = "png";
  else if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") kind = "webp";
  else if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) kind = "avif";
  const expected: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  if (!kind || mime !== expected[kind])
    throw new ApiError(415, "Envie apenas JPEG, PNG, WebP ou AVIF válidos.");
  try {
    const { width, height } = imageSize(bytes);
    if (!width || !height || width > 16000 || height > 16000 || width * height > 60000000)
      throw new Error();
  } catch {
    throw new ApiError(400, "A imagem está danificada ou tem dimensões excessivas.");
  }
  return kind;
}
