import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { applications, serviceTypes, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

function fallbackLetter(app: any, svcName: string, ownerName: string) {
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Surat ${svcName} - ${app.applicationNumber}</title>
<style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:40px;border:1px solid #ccc;color:#222}
.wm{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-24deg);font-size:64px;font-weight:900;color:rgba(180,40,40,.14);border:4px solid rgba(180,40,40,.14);padding:10px 28px;letter-spacing:2px}
.kop{text-align:center;border-bottom:3px double #333;padding-bottom:12px;margin-bottom:20px}.kop h2{margin:0}.kop p{margin:2px 0;font-size:13px}</style></head><body>
<div class="wm">SIMULASI</div>
<div class="kop"><h2>PEMERINTAH KOTA CONTOH — KECAMATAN CONTOH</h2><h3>KELURAHAN CONTOH (SIMULASI)</h3><p>Jl. Contoh No. 1, Telp. (021) 000000 — Data simulasi, bukan dokumen resmi</p></div>
<p style="text-align:center"><b><u>${svcName.toUpperCase()}</u></b><br>Nomor: ${app.letterNumber ?? "-"}</p>
<p>Yang bertanda tangan di bawah ini, Lurah Contoh (simulasi), menerangkan bahwa:</p>
<table><tr><td>Nama</td><td>: <b>${ownerName}</b></td></tr><tr><td>No. Pengajuan</td><td>: ${app.applicationNumber}</td></tr><tr><td>Keperluan</td><td>: ${svcName}</td></tr></table>
<p>Nama tersebut di atas adalah warga Kelurahan Contoh berdasarkan data administrasi yang terverifikasi pada sistem kelar.in (simulasi).</p>
<p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya. <b>Dokumen ini adalah SIMULASI / BUKAN DOKUMEN RESMI dan tidak memiliki kekuatan hukum.</b> Tidak terdapat tanda tangan elektronik resmi.</p>
<br><br><div style="text-align:right">Contoh, ${new Date().toLocaleDateString("id-ID")}<br><br><br><br><b>( Lurah Contoh — simulasi )</b></div>
<p style="margin-top:30px;font-size:12px;color:#666">Dicetak dari kelar.in • ID ${app.id} • ${new Date().toISOString()}</p>
</body></html>`;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const app = rows[0];
  if (!app) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  if (user.role === "WARGA" && app.userId !== user.id)
    return NextResponse.json({ error: "Bukan milik Anda." }, { status: 403 });
  if (app.status !== "SELESAI")
    return NextResponse.json({ error: "Surat belum tersedia." }, { status: 400 });
  try {
    if (app.letterPath) {
      const full = path.join(process.cwd(), "public", app.letterPath);
      const html = await readFile(full, "utf-8");
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="Surat-${app.applicationNumber}-SIMULASI.html"`,
        },
      });
    }
  } catch {
    // fall through to generate
  }
  const svc = (await db.select().from(serviceTypes).where(eq(serviceTypes.id, app.serviceTypeId)).limit(1))[0];
  const owner = (await db.select().from(users).where(eq(users.id, app.userId)).limit(1))[0];
  const html = fallbackLetter(app, svc?.name ?? "Surat Keterangan", owner?.name ?? "-");
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="Surat-${app.applicationNumber}-SIMULASI.html"`,
    },
  });
}
