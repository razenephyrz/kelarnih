import { db, pool } from "./index";
import {
  users,
  serviceTypes,
  serviceRequirements,
  applications,
  applicationDocuments,
  approvalSteps,
  applicationEvents,
  notifications,
  ratings,
  slaConfig,
} from "./schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function addBizDays(from: Date, n: number) {
  const d = new Date(from);
  let a = 0;
  while (a < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) a++;
  }
  d.setUTCHours(8, 0, 0, 0);
  return d;
}
let appCounter = 100;
function appNo() {
  appCounter += 1;
  const d = new Date();
  return `KL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${appCounter}`;
}

async function main() {
  console.log("Seeding kelar.in (demo)...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

  // wipe
  await db.execute(sql`TRUNCATE TABLE ratings, notifications, application_events, approval_steps, application_documents, applications, service_requirements, service_types, sessions, users, sla_config, audit_logs RESTART IDENTITY CASCADE`);

  const pw = {
    warga: await bcrypt.hash("warga123", 10),
    petugas: await bcrypt.hash("petugas123", 10),
    rtrw: await bcrypt.hash("rtrw123", 10),
    lurah: await bcrypt.hash("lurah123", 10),
    camat: await bcrypt.hash("camat123", 10),
  };

  const userRows = await db
    .insert(users)
    .values([
      { name: "Ibna Warga", email: "warga@kelar.in", passwordHash: pw.warga, role: "WARGA", phone: "0812-0000-0001", address: "Jl. Melati No. 12 RT 03 RW 05, Kel. Contoh", nik: "3201010101010001", rt: "03", rw: "05" },
      { name: "Sari Puspita", email: "sari@kelar.in", passwordHash: pw.warga, role: "WARGA", phone: "0812-0000-0002", address: "Jl. Kenanga No. 8 RT 02 RW 05", nik: "3201010202020002", rt: "02", rw: "05" },
      { name: "Budi Santoso", email: "budi@kelar.in", passwordHash: pw.warga, role: "WARGA", phone: "0812-0000-0003", address: "Jl. Mawar No. 21 RT 04 RW 05", nik: "3201010303030003", rt: "04", rw: "05" },
      { name: "Dewi Lestari", email: "dewi@kelar.in", passwordHash: pw.warga, role: "WARGA", phone: "0812-0000-0004", address: "Jl. Anggrek No. 5 RT 01 RW 06", nik: "3201010404040004", rt: "01", rw: "06" },
      { name: "Andi Petugas", email: "petugas@kelar.in", passwordHash: pw.petugas, role: "PETUGAS", phone: "0812-1000-0001", address: "Kantor Kelurahan Contoh" },
      { name: "Rina Petugas", email: "rina.petugas@kelar.in", passwordHash: pw.petugas, role: "PETUGAS", phone: "0812-1000-0002", address: "Kantor Kelurahan Contoh" },
      { name: "H. Bambang (RT/RW)", email: "rtrw@kelar.in", passwordHash: pw.rtrw, role: "RT_RW", phone: "0812-2000-0001", address: "Jl. Melati RT 03 RW 05", rt: "03", rw: "05" },
      { name: "Dra. Ratna Wulandari", email: "lurah@kelar.in", passwordHash: pw.lurah, role: "LURAH", phone: "0812-3000-0001", address: "Kantor Kelurahan Contoh" },
      { name: "Drs. H. Camat Contoh", email: "camat@kelar.in", passwordHash: pw.camat, role: "CAMAT", phone: "0812-4000-0001", address: "Kantor Kecamatan Contoh" },
    ])
    .returning();
  const byEmail = Object.fromEntries(userRows.map((u) => [u.email, u]));
  const warga1 = byEmail["warga@kelar.in"];
  const warga2 = byEmail["sari@kelar.in"];
  const warga3 = byEmail["budi@kelar.in"];
  const warga4 = byEmail["dewi@kelar.in"];
  const petugas1 = byEmail["petugas@kelar.in"];
  const petugas2 = byEmail["rina.petugas@kelar.in"];
  const rtrw = byEmail["rtrw@kelar.in"];
  const lurah = byEmail["lurah@kelar.in"];
  const camat = byEmail["camat@kelar.in"];

  await db.insert(slaConfig).values([
    { key: "workdays", value: { days: ["MON", "TUE", "WED", "THU", "FRI"] }, description: "Hari kerja ilustratif (Senin-Jumat). Data demo." },
    { key: "work_hours", value: { start: "08:00", end: "15:00", zone: "Asia/Jakarta" }, description: "Jam pelayanan ilustratif." },
    { key: "upload", value: { max_mb: 5, mimes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"] }, description: "Batas upload." },
    { key: "priority_target", value: { label: "Hari ini sebelum 15.00", sla_days: 1 }, description: "Target prioritas ilustratif." },
  ]);

  // ---- Services ----
  const servicesDef: Array<any> = [
    { slug: "domisili", name: "Surat Keterangan Domisili", description: "Menyatakan tempat tinggal warga di wilayah kelurahan. Umumnya untuk administrasi bank, sekolah, atau pekerjaan.", category: "Kependudukan", icon: "home", baseSlaDays: 2, prioritySlaDays: 1, priorityEnabled: true, requiresCamat: false, conditions: [{ field: "tinggal_status", label: "Status tempat tinggal", type: "select", options: ["milik_sendiri", "kontrak", "menumpang"] }, { field: "keperluan", label: "Keperluan surat", type: "select", options: ["pribadi", "usaha"] }], slaNote: "Ilustratif: 2 hari kerja setelah terverifikasi." },
    { slug: "sktm", name: "Surat Keterangan Tidak Mampu (SKTM)", description: "Keterangan kondisi ekonomi untuk akses bantuan, keringanan biaya pendidikan atau kesehatan.", category: "Kesejahteraan", icon: "heart", baseSlaDays: 3, prioritySlaDays: 1, priorityEnabled: false, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 3 hari kerja setelah terverifikasi." },
    { slug: "sku", name: "Surat Keterangan Usaha (SKU)", description: "Menyatakan keberadaan usaha warga untuk keperluan permodalan, perizinan, atau kemitraan.", category: "Usaha", icon: "store", baseSlaDays: 3, prioritySlaDays: 2, priorityEnabled: false, requiresCamat: false, conditions: [{ field: "tempat_status", label: "Status tempat usaha", type: "select", options: ["milik_sendiri", "sewa"] }], slaNote: "Ilustratif: 3 hari kerja." },
    { slug: "penghasilan", name: "Surat Keterangan Penghasilan", description: "Menyatakan besaran penghasilan untuk keperluan administrasi bank, beasiswa, atau bantuan.", category: "Kesejahteraan", icon: "wallet", baseSlaDays: 2, prioritySlaDays: 1, priorityEnabled: false, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 2 hari kerja." },
    { slug: "belum-menikah", name: "Surat Keterangan Belum Menikah", description: "Menyatakan status perkawinan untuk keperluan melamar pekerjaan, pernikahan, atau administrasi lain.", category: "Kependudukan", icon: "user", baseSlaDays: 2, prioritySlaDays: 1, priorityEnabled: false, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 2 hari kerja." },
    { slug: "kematian", name: "Surat Keterangan Kematian", description: "Menyatakan peristiwa kematian untuk pengurusan akta kematian, ahli waris, dan administrasi keluarga.", category: "Kependudukan", icon: "file", baseSlaDays: 1, prioritySlaDays: 1, priorityEnabled: true, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 1 hari kerja, dapat prioritas duka." },
    { slug: "kelahiran", name: "Surat Keterangan Kelahiran", description: "Pengantar kelahiran untuk pengurusan akta kelahiran di Disdukcapil.", category: "Kependudukan", icon: "baby", baseSlaDays: 2, prioritySlaDays: 1, priorityEnabled: false, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 2 hari kerja." },
    { slug: "ahli-waris", name: "Surat Keterangan Ahli Waris", description: "Menyatakan para ahli waris berikut persetujuan Lurah dan Camat sesuai SOP. Proses lebih panjang.", category: "Hukum", icon: "scale", baseSlaDays: 7, prioritySlaDays: 5, priorityEnabled: false, requiresCamat: true, conditions: [], slaNote: "Ilustratif: 7 hari kerja termasuk verifikasi Camat." },
    { slug: "beda-identitas", name: "Surat Keterangan Beda Identitas", description: "Menjelaskan perbedaan nama/identitas antar dokumen (mis. ijazah vs KTP) untuk keperluan pembetulan.", category: "Kependudukan", icon: "id", baseSlaDays: 3, prioritySlaDays: 2, priorityEnabled: false, requiresCamat: false, conditions: [], slaNote: "Ilustratif: 3 hari kerja." },
  ];
  const svcRows = await db.insert(serviceTypes).values(servicesDef).returning();
  const svcBySlug = Object.fromEntries(svcRows.map((s) => [s.slug, s]));

  const reqs: Array<any> = [];
  function R(slug: string, list: Array<any>) {
    list.forEach((r, i) => reqs.push({ serviceTypeId: svcBySlug[slug].id, sortOrder: i, ...r }));
  }
  R("domisili", [
    { key: "ktp", name: "KTP-el", description: "Foto/scan KTP yang masih berlaku", whyNeeded: "Verifikasi identitas pemohon.", requirementType: "WAJIB" },
    { key: "kk", name: "Kartu Keluarga (KK)", description: "KK yang mencantumkan pemohon", whyNeeded: "Verifikasi susunan keluarga & alamat.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "Surat pengantar dari ketua RT/RW", whyNeeded: "Bukti domisili diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "izin_pemilik", name: "Surat izin pemilik kos/rumah", description: "Jika menumpang/kontrak", whyNeeded: "Persetujuan pemilik tempat tinggal.", requirementType: "KONDISIONAL", conditionField: "tinggal_status", conditionValues: ["kontrak", "menumpang"] },
    { key: "ket_perusahaan", name: "Surat keterangan perusahaan/lembaga", description: "Jika untuk keperluan usaha/lembaga", whyNeeded: "Keterkaitan domisili usaha.", requirementType: "KONDISIONAL", conditionField: "keperluan", conditionValues: ["usaha"] },
  ]);
  R("sktm", [
    { key: "ktp", name: "KTP-el", description: "Identitas pemohon", whyNeeded: "Verifikasi identitas.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "Kartu keluarga", whyNeeded: "Verifikasi keluarga.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "Pengantar lingkungan", whyNeeded: "Validasi kondisi oleh lingkungan.", requirementType: "WAJIB" },
    { key: "pernyataan_materai", name: "Surat pernyataan tidak mampu bermaterai", description: "Pernyataan bermaterai Rp10.000", whyNeeded: "Pernyataan formal kondisi.", requirementType: "WAJIB" },
    { key: "foto_rumah", name: "Foto rumah", description: "Tampak depan rumah", whyNeeded: "Verifikasi visual bila diminta.", requirementType: "OPSIONAL" },
    { key: "ket_penghasilan", name: "Keterangan penghasilan", description: "Slip/keterangan penghasilan", whyNeeded: "Dasar penilaian kelayakan.", requirementType: "WAJIB" },
  ]);
  R("sku", [
    { key: "ktp", name: "KTP-el", description: "", whyNeeded: "Identitas pemilik usaha.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "", whyNeeded: "Domisili pemilik.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "", whyNeeded: "Usaha diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "foto_usaha", name: "Foto tempat usaha", description: "Foto tampak depan & aktivitas", whyNeeded: "Bukti keberadaan usaha.", requirementType: "WAJIB" },
    { key: "surat_sewa", name: "Surat sewa/izin pemilik tempat", description: "Jika menyewa", whyNeeded: "Legalitas menempati lokasi.", requirementType: "KONDISIONAL", conditionField: "tempat_status", conditionValues: ["sewa"] },
    { key: "bukti_pbb", name: "Bukti PBB", description: "Jika milik sendiri", whyNeeded: "Bukti kepemilikan lokasi.", requirementType: "KONDISIONAL", conditionField: "tempat_status", conditionValues: ["milik_sendiri"] },
  ]);
  R("penghasilan", [
    { key: "ktp", name: "KTP-el", description: "", whyNeeded: "Identitas.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "", whyNeeded: "Keluarga.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "", whyNeeded: "Diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "pernyataan_penghasilan", name: "Surat pernyataan penghasilan bermaterai", description: "", whyNeeded: "Pernyataan besaran penghasilan.", requirementType: "WAJIB" },
    { key: "slip_gaji", name: "Slip gaji / keterangan usaha", description: "Jika ada", whyNeeded: "Penguat besaran penghasilan.", requirementType: "OPSIONAL" },
  ]);
  R("belum-menikah", [
    { key: "ktp", name: "KTP-el", description: "", whyNeeded: "Identitas.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "", whyNeeded: "Status dalam keluarga.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "", whyNeeded: "Diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "pernyataan_belum_menikah", name: "Surat pernyataan bermaterai", description: "Menyatakan belum menikah", whyNeeded: "Pernyataan formal.", requirementType: "WAJIB" },
  ]);
  R("kematian", [
    { key: "ktp_kk_alm", name: "KTP/KK almarhum", description: "", whyNeeded: "Identitas almarhum.", requirementType: "WAJIB" },
    { key: "ket_rt_rw", name: "Surat keterangan RT/RW", description: "", whyNeeded: "Peristiwa diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "ktp_pelapor", name: "KTP pelapor", description: "KTP keluarga/pelapor", whyNeeded: "Identitas pelapor.", requirementType: "WAJIB" },
    { key: "surat_dokter", name: "Surat dokter/RS", description: "Jika ada", whyNeeded: "Penguat penyebab/waktu.", requirementType: "OPSIONAL" },
  ]);
  R("kelahiran", [
    { key: "ket_bidan_rs", name: "Surat keterangan bidan/RS", description: "Surat Keterangan Lahir", whyNeeded: "Bukti kelahiran.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "", whyNeeded: "Keluarga.", requirementType: "WAJIB" },
    { key: "ktp_ortu", name: "KTP orang tua", description: "Ayah & ibu", whyNeeded: "Identitas orang tua.", requirementType: "WAJIB" },
    { key: "buku_nikah", name: "Buku nikah", description: "Orang tua", whyNeeded: "Status perkawinan ortu.", requirementType: "WAJIB" },
  ]);
  R("ahli-waris", [
    { key: "ktp_kk_ahli", name: "KTP/KK semua ahli waris", description: "", whyNeeded: "Identitas para ahli waris.", requirementType: "WAJIB" },
    { key: "akta_kematian", name: "Akta kematian pewaris", description: "", whyNeeded: "Bukti pewaris meninggal.", requirementType: "WAJIB" },
    { key: "buku_nikah_pewaris", name: "Buku nikah pewaris", description: "", whyNeeded: "Hubungan keluarga.", requirementType: "WAJIB" },
    { key: "pernyataan_waris", name: "Surat pernyataan ahli waris bermaterai", description: "", whyNeeded: "Kesepakatan ahli waris.", requirementType: "WAJIB" },
    { key: "saksi", name: "Saksi RT/RW atau tetangga", description: "KTP 2 saksi", whyNeeded: "Penguat keterangan.", requirementType: "WAJIB" },
  ]);
  R("beda-identitas", [
    { key: "ktp", name: "KTP", description: "", whyNeeded: "Identitas utama.", requirementType: "WAJIB" },
    { key: "kk", name: "KK", description: "", whyNeeded: "Pembanding.", requirementType: "WAJIB" },
    { key: "dokumen_beda", name: "Dokumen yang berbeda (ijazah/akta)", description: "", whyNeeded: "Dokumen pembanding perbedaan.", requirementType: "WAJIB" },
    { key: "pengantar_rt_rw", name: "Pengantar RT/RW", description: "", whyNeeded: "Diketahui lingkungan.", requirementType: "WAJIB" },
    { key: "pernyataan", name: "Surat pernyataan bermaterai", description: "", whyNeeded: "Penjelasan perbedaan.", requirementType: "WAJIB" },
  ]);
  await db.insert(serviceRequirements).values(reqs);

  // helper to create app
  async function createApp(opts: {
    owner: any; svc: string; status: string; submittedDaysAgo: number;
    verifiedDaysAgo?: number | null; dueInDays?: number | null; completedDaysAgo?: number | null;
    isPriority?: boolean; priorityStatus?: string; priorityReason?: string;
    formData?: any; note?: string; delayReason?: string; staff?: any;
    paused?: boolean; letterNo?: string;
  }) {
    const svc = svcBySlug[opts.svc];
    const submittedAt = daysAgo(opts.submittedDaysAgo);
    const verifiedAt = opts.verifiedDaysAgo != null ? daysAgo(opts.verifiedDaysAgo) : null;
    let dueAt: Date | null = null;
    if (verifiedAt) {
      const slaDays = opts.isPriority && opts.priorityStatus === "APPROVED" ? svc.prioritySlaDays : svc.baseSlaDays;
      dueAt = addBizDays(verifiedAt, slaDays);
    }
    if (opts.dueInDays != null && verifiedAt) {
      // override for overdue demo: due = verified + dueInDays calendar
      const d = new Date(verifiedAt); d.setDate(d.getDate() + opts.dueInDays); dueAt = d;
    }
    const completedAt = opts.completedDaysAgo != null ? daysAgo(opts.completedDaysAgo) : null;
    const no = appNo();
    const [row] = await db.insert(applications).values({
      applicationNumber: no,
      userId: opts.owner.id,
      serviceTypeId: svc.id,
      status: opts.status,
      formData: opts.formData ?? {},
      citizenNote: opts.note ?? null,
      isPriority: !!opts.isPriority,
      priorityReason: opts.priorityReason ?? null,
      priorityStatus: opts.priorityStatus ?? (opts.isPriority ? "PENDING" : "NONE"),
      priorityNote: opts.isPriority ? "Menunggu keputusan petugas." : null,
      submittedAt,
      verifiedAt,
      slaStartedAt: verifiedAt,
      dueAt,
      completedAt,
      createdAt: submittedAt,
      updatedAt: completedAt ?? submittedAt,
      pausedAt: opts.paused ? new Date() : null,
      delayReason: opts.delayReason ?? null,
      staffHandlerId: opts.staff?.id ?? petugas1.id,
      letterNumber: opts.letterNo ?? (opts.status === "SELESAI" ? `470/${appCounter}/KL-Contoh/2026` : null),
      letterPath: opts.status === "SELESAI" ? `/uploads/letters/${no}.html` : null,
    }).returning();

    // docs (simulated files)
    const reqList = reqs.filter((r) => r.serviceTypeId === svc.id).slice(0, 4);
    for (const r of reqList) {
      await db.insert(applicationDocuments).values({
        applicationId: row.id,
        requirementKey: r.key,
        requirementName: r.name,
        fileName: `${r.key}-${no}.pdf`,
        fileType: "application/pdf",
        fileSize: 245000,
        filePath: `/uploads/${no}-${r.key}.pdf`,
        status: opts.status === "MENUNGGU_WARGA" && r.key === reqList[reqList.length - 1].key ? "DITOLAK" : "DIVERIFIKASI",
        note: null,
      });
    }
    // approval steps
    const stages = ["RT_RW", "LURAH"];
    if (svc.requiresCamat) stages.push("CAMAT");
    const order: Record<string, number> = { MENUNGGU_VERIFIKASI: 0, MENUNGGU_WARGA: 1, TERVERIFIKASI: 2, SEDANG_DIPROSES: 3, MENUNGGU_RT_RW: 4, MENUNGGU_LURAH: 5, MENUNGGU_CAMAT: 6, FINALISASI: 7, SELESAI: 8 };
    const idx = order[opts.status] ?? 0;
    for (const st of stages) {
      let s = "MENUNGGU";
      let actor: any = null;
      if ((st === "RT_RW" && idx >= 5) || (st === "LURAH" && idx >= 7) || (st === "CAMAT" && idx >= 7 && svc.requiresCamat)) { s = "DISETUJUI"; actor = st === "RT_RW" ? rtrw : st === "LURAH" ? lurah : camat; }
      else if ((st === "RT_RW" && idx === 4) || (st === "LURAH" && idx === 5) || (st === "CAMAT" && idx === 6)) s = "MENUNGGU";
      await db.insert(approvalSteps).values({
        applicationId: row.id, stage: st, status: s, actorId: actor?.id ?? null,
        note: s === "DISETUJUI" ? "Disetujui, data sesuai." : null,
        actedAt: s === "DISETUJUI" ? daysAgo(Math.max(0, (opts.verifiedDaysAgo ?? 2) - 1)) : null,
      });
    }
    // events
    await db.insert(applicationEvents).values({
      applicationId: row.id, actorId: opts.owner.id, actorName: opts.owner.name, actorRole: "WARGA",
      previousStatus: null, newStatus: "MENUNGGU_VERIFIKASI", title: "Pengajuan dikirim",
      description: `Pengajuan ${no} untuk ${svc.name} dikirim warga.`,
    });
    if (verifiedAt) {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: petugas1.id, actorName: petugas1.name, actorRole: "PETUGAS",
        previousStatus: "MENUNGGU_VERIFIKASI", newStatus: "TERVERIFIKASI", title: "Dokumen terverifikasi",
        description: "Seluruh persyaratan dinyatakan lengkap. SLA mulai berjalan.",
      });
    }
    if (idx >= 3 && opts.status !== "MENUNGGU_WARGA") {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: petugas1.id, actorName: petugas1.name, actorRole: "PETUGAS",
        previousStatus: "TERVERIFIKASI", newStatus: "SEDANG_DIPROSES", title: "Surat sedang diproses",
        description: "Petugas menyusun draf surat.",
      });
    }
    if (opts.status === "MENUNGGU_WARGA") {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: petugas1.id, actorName: petugas1.name, actorRole: "PETUGAS",
        previousStatus: "MENUNGGU_VERIFIKASI", newStatus: "MENUNGGU_WARGA", title: "Dokumen dikembalikan",
        description: "Ada dokumen kurang jelas. SLA dijeda hingga warga memperbaiki.",
      });
    }
    if (idx >= 5) {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: rtrw.id, actorName: rtrw.name, actorRole: "RT_RW",
        previousStatus: "MENUNGGU_RT_RW", newStatus: "MENUNGGU_LURAH", title: "Disetujui RT/RW",
        description: "Lingkungan menyetujui permohonan.",
      });
    }
    if (idx >= 7) {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: lurah.id, actorName: lurah.name, actorRole: "LURAH",
        previousStatus: "MENUNGGU_LURAH", newStatus: "FINALISASI", title: "Disetujui Lurah",
        description: "Persetujuan akhir diberikan, lanjut finalisasi.",
      });
    }
    if (opts.status === "SELESAI") {
      await db.insert(applicationEvents).values({
        applicationId: row.id, actorId: petugas1.id, actorName: petugas1.name, actorRole: "PETUGAS",
        previousStatus: "FINALISASI", newStatus: "SELESAI", title: "Surat diterbitkan",
        description: `Surat nomor ${row.letterNumber} diterbitkan (SIMULASI).`,
      });
    }
    // notif to owner
    await db.insert(notifications).values({
      userId: opts.owner.id, applicationId: row.id, type: "STATUS",
      title: opts.status === "SELESAI" ? "Surat berhasil diterbitkan" : `Status: ${opts.status}`,
      message: `Pengajuan ${no} (${svc.name}) kini berstatus ${opts.status}.`,
      link: `/pengajuan/${row.id}`,
    });
    return row;
  }

  // Specific demo apps
  const a1 = await createApp({ owner: warga1, svc: "domisili", status: "SELESAI", submittedDaysAgo: 10, verifiedDaysAgo: 9, completedDaysAgo: 7, formData: { tinggal_status: "milik_sendiri", keperluan: "pribadi", nama: "Ibna Warga", nik: "3201010101010001" }, note: "Untuk keperluan administrasi bank." });
  const a2 = await createApp({ owner: warga1, svc: "sktm", status: "SELESAI", submittedDaysAgo: 8, verifiedDaysAgo: 7, completedDaysAgo: 5, note: "Untuk keringanan biaya sekolah." });
  const a3 = await createApp({ owner: warga2, svc: "sku", status: "MENUNGGU_VERIFIKASI", submittedDaysAgo: 1, formData: { tempat_status: "sewa", nama_usaha: "Warung Sari" } });
  const a4 = await createApp({ owner: warga1, svc: "penghasilan", status: "MENUNGGU_WARGA", submittedDaysAgo: 4, verifiedDaysAgo: 3, paused: true, note: "Untuk pengajuan beasiswa." });
  const a5 = await createApp({ owner: warga2, svc: "belum-menikah", status: "TERVERIFIKASI", submittedDaysAgo: 3, verifiedDaysAgo: 1 });
  const a6 = await createApp({ owner: warga3, svc: "kematian", status: "SEDANG_DIPROSES", submittedDaysAgo: 3, verifiedDaysAgo: 2, isPriority: true, priorityStatus: "APPROVED", priorityReason: "dika" });
  const a7 = await createApp({ owner: warga2, svc: "domisili", status: "MENUNGGU_RT_RW", submittedDaysAgo: 5, verifiedDaysAgo: 4, formData: { tinggal_status: "kontrak", keperluan: "pribadi" } });
  const a8 = await createApp({ owner: warga3, svc: "sku", status: "MENUNGGU_LURAH", submittedDaysAgo: 6, verifiedDaysAgo: 5 });
  const a9 = await createApp({ owner: warga1, svc: "ahli-waris", status: "MENUNGGU_CAMAT", submittedDaysAgo: 12, verifiedDaysAgo: 10, note: "Ahli waris alm. ayah." });
  const a10 = await createApp({ owner: warga2, svc: "kelahiran", status: "FINALISASI", submittedDaysAgo: 4, verifiedDaysAgo: 3 });
  const a11 = await createApp({ owner: warga4, svc: "beda-identitas", status: "DITOLAK", submittedDaysAgo: 9, verifiedDaysAgo: 8 });
  const a12 = await createApp({ owner: warga3, svc: "kematian", status: "MENUNGGU_VERIFIKASI", submittedDaysAgo: 0, isPriority: true, priorityStatus: "PENDING", priorityReason: "dika" });
  // overdue demo: verified 10 days ago, base 2 days -> overdue
  const a13 = await createApp({ owner: warga4, svc: "sktm", status: "SEDANG_DIPROSES", submittedDaysAgo: 12, verifiedDaysAgo: 10, delayReason: "Estimasi diperbarui karena menunggu tanda tangan lurah." });
  await db.execute(sql`UPDATE applications SET due_at = NOW() - INTERVAL '2 days' WHERE id = ${a13.id}`);

  // Historical apps for charts/ratings (last 6 months, mostly SELESAI)
  const histOwners = [warga1, warga2, warga3, warga4];
  const histSvcs = ["domisili", "sktm", "sku", "penghasilan", "belum-menikah", "kematian", "kelahiran", "beda-identitas"];
  const categories = ["KECEPATAN", "KERAMAHAN", "KEJELASAN"];
  const comments = [
    "Pelayanan cepat dan jelas, terima kasih.",
    "Petugas ramah, alur mudah dipahami.",
    "Sempat diminta perbaikan berkas, tapi dijelaskan dengan baik.",
    "Estimasi transparan, surat terbit sesuai info.",
    "Antrean prioritas sangat membantu saat duka.",
    "Informasi persyaratan lengkap di awal.",
    null, null,
  ];
  let histCount = 0;
  for (let m = 5; m >= 0; m--) {
    const perMonth = m === 0 ? 4 : 5 + (m % 2);
    for (let i = 0; i < perMonth; i++) {
      const owner = histOwners[(m + i) % histOwners.length];
      const svc = histSvcs[(m * 3 + i) % histSvcs.length];
      const submitted = 30 * m + i * 3 + 2;
      const verified = submitted - 1 >= 0 ? submitted - 1 : submitted;
      const completed = Math.max(0, submitted - 3 - (i % 3));
      const late = (m === 2 && i === 0) || (m === 4 && i === 1);
      const row = await createApp({
        owner, svc, status: "SELESAI",
        submittedDaysAgo: submitted, verifiedDaysAgo: verified,
        completedDaysAgo: late ? Math.max(0, submitted - 6) : completed,
      });
      if (late) {
        await db.execute(sql`UPDATE applications SET due_at = ${daysAgo(submitted - 1 + 0).toISOString()}::timestamptz, delay_reason = 'Keterlambatan ilustratif: verifikasi tambahan.' WHERE id = ${row.id}`);
      }
      // rating ~85% give rating
      if ((i + m) % 7 !== 6) {
        const score = [5, 5, 4, 5, 4, 3, 5, 4][(m + i) % 8];
        await db.insert(ratings).values({
          applicationId: row.id, citizenId: owner.id, staffId: petugas1.id, lurahId: lurah.id,
          score, category: categories[(m + i) % 3],
          comment: comments[(m + i) % comments.length],
          contextTag: (i % 5 === 4) ? "dokumen sempat dikembalikan" : null,
        });
      }
      histCount++;
    }
  }
  // ratings for a1 (completed demo)
  await db.insert(ratings).values([
    { applicationId: a1.id, citizenId: warga1.id, staffId: petugas1.id, lurahId: lurah.id, score: 5, category: "KECEPATAN", comment: "Sangat cepat, estimasi sesuai. Terima kasih!" },
    // a2 left unrated intentionally for demo rating form
  ]).catch(() => {});
  // a few more ratings to reach ~38
  // (hist already ~28 ratings)

  console.log(`Seed done. Historical apps: ${histCount}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
