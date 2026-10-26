import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Ambil semua data dari semua kelompok
    const { data: submissions, error } = await supabase
      .from('individual_submissions')
      .select('*')
      .order('payload->>group', { ascending: true })
      .order('module_id', { ascending: true });

    if (error) throw error;

    // 2. Siapkan file PowerPoint
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // --- SLIDE 1: COVER MASTER BLUEPRINT ---
    let slide1 = pptx.addSlide();
    slide1.background = { color: "0F172A" }; // Biru gelap elegan
    slide1.addText("MASTER BLUEPRINT", { x: 1, y: 2, w: 8, h: 1, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText("Artefak Karya Bersama Satu Kelas\nLatihan Dasar Kepemimpinan (LDK)\nFK UPN \"Veteran\" Jakarta", { x: 1, y: 3.2, w: 8, h: 1.5, fontSize: 20, color: "94A3B8", align: "center" });

    // --- SLIDE 2: RINGKASAN DATA KELAS ---
    let slide2 = pptx.addSlide();
    slide2.addText("Ringkasan Partisipasi Kelas", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    
    // Hitung data unik per kelompok
    const groups = [...new Set(submissions.map(s => s.payload?.group))].sort();
    slide2.addText(`Total Kelompok Terdata: ${groups.length}`, { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 20 });

    // --- SLIDE 3+: HASIL PER KELOMPOK (Fokus Modul 3, 6, 8) ---
    groups.forEach((grp) => {
      let slideGrp = pptx.addSlide();
      slideGrp.addText(`Hasil Kerja Kelompok ${grp}`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
      
      let yPos = 1.5;

      // Ambil Modul 3 (Komunikasi)
      const mod3 = submissions.find(s => s.payload?.group === grp && s.module_id === 3);
      if (mod3) {
        slideGrp.addText(`Komunikasi (Proyek):`, { x: 0.5, y: yPos, w: 9, h: 0.3, fontSize: 16, bold: true, color: "065F46" });
        slideGrp.addText(`Usulan: ${mod3.payload.usulan}`, { x: 0.5, y: yPos + 0.4, w: 9, h: 0.6, fontSize: 14 });
        yPos += 1.2;
      }

      // Ambil Modul 6 (Strategi)
      const mod6 = submissions.find(s => s.payload?.group === grp && s.module_id === 6);
      if (mod6) {
        slideGrp.addText(`Strategi (Roadmap):`, { x: 0.5, y: yPos, w: 9, h: 0.3, fontSize: 16, bold: true, color: "1D4ED8" });
        slideGrp.addText(`Aksi: ${mod6.payload.action_plan}`, { x: 0.5, y: yPos + 0.4, w: 9, h: 0.6, fontSize: 14 });
        yPos += 1.2;
      }

      // Ambil Modul 8 (Mentoring)
      const mod8 = submissions.find(s => s.payload?.group === grp && s.module_id === 8);
      if (mod8) {
        slideGrp.addText(`Mentoring (Goal & Will):`, { x: 0.5, y: yPos, w: 9, h: 0.3, fontSize: 16, bold: true, color: "B45309" });
        slideGrp.addText(`Goal: ${mod8.payload.grow.goal}\nWill: ${mod8.payload.grow.will}`, { x: 0.5, y: yPos + 0.4, w: 9, h: 0.8, fontSize: 14 });
      }
    });

    // 3. Simpan Log ke Supabase
    await supabase.from('master_blueprints').insert({
      file_name: `Master_Blueprint_LDK_UPNVJ.pptx`,
    });

    // 4. Kirim file
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Master_Blueprint_LDK.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("PPTX Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}