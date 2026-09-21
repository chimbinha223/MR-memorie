import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
if (!process.stdin.isTTY) throw new Error("Execute num terminal interativo.");
let hidden = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!hidden) process.stdout.write(chunk);
    callback();
  },
});
const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
try {
  const email = (await rl.question("Email do administrador: ")).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido.");
  process.stdout.write("Palavra-passe (não aparece no ecrã): ");
  hidden = true;
  const password = await rl.question("");
  hidden = false;
  process.stdout.write("\n");
  if (password.length < 12 || Buffer.byteLength(password) > 72)
    throw new Error("Use pelo menos 12 caracteres e no máximo 72 bytes.");
  process.stdout.write("Repita a palavra-passe: ");
  hidden = true;
  const confirm = await rl.question("");
  hidden = false;
  process.stdout.write("\n");
  if (password !== confirm) throw new Error("As palavras-passe não coincidem.");
  const hash = await bcrypt.hash(password, 12);
  const secret = randomBytes(48).toString("base64url");
  await writeFile(
    new URL("../.env.admin.local", import.meta.url),
    "ADMIN_EMAIL=" + email + "\nADMIN_PASSWORD_HASH=" + hash + "\nAUTH_SECRET=" + secret + "\n",
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Criado app/.env.admin.local, ignorado pelo Git. Copie os três valores para os segredos do site no Higgsfield. Nunca os envie por chat. Adicione também MR_MEMORIE_GITHUB_TOKEN nas definições.",
  );
} finally {
  hidden = false;
  rl.close();
}
