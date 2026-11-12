import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "File wajib diunggah." }, { status: 400 });
    if (!ALLOWED.includes(file.type) && !(file.type === "image/jpeg" || file.name.match(/\.(pdf|jpg|jpeg|png)$/i))) {
      return NextResponse.json({ error: "Jenis file harus PDF, JPG, JPEG, atau PNG." }, { status: 400 });
    }
    if (file.size > MAX) return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase().slice(0, 5);
    const fname = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, fname), buf);
    return NextResponse.json({
      path: `/uploads/${fname}`,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
  }
}
