import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group');

    if (!groupId) {
      return NextResponse.json({ error: 'Parameter group wajib diisi' }, { status: 400 });
    }

    // 1. Ambil data khusus untuk kelompok ini
    const { data: submissions, error } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('payload->>group', groupId)
      .order('module_id', { ascending: true });

    if (error) throw error;

    // 2. Siapkan file PowerPoint
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // --- SLIDE 1: COVER KELOMPOK ---
    let slide1 = pptx.addSlide();
    slide1.background = { color: "1E3A8A" }; // Biru UPNVJ
    slide1.addText(`HASIL DISKUSI KELOMPOK ${groupId}`, { x: 1, y: 2, w: 8, h: 1, fontSize: 40, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText("Latihan Dasar Kepemimpinan (LDK)\nFK UPN \"Veteran\" Jakarta", { x: 1, y: 3.2, w: 8, h: 1, fontSize: 20, color: "E2E8F0", align: "center" });

    // --- SLIDE 2: DAFTAR ANGGOTA & PROYEK ---
    let slide2 = pptx.addSlide();
    slide2.addText(`Profil Kelompok ${groupId}`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    
    // Ambil nama unik anggota
    const members = [...new Set(submissions.map(s => s.payload?.name || 'Anonim'))];
    slide2.addText(`Anggota Kelompok:\n- ${members.join('\n- ')}`, { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18, color: "333333" });

    // Cari judul proyek dari Modul 3 (jika ada)
    const modul3 = submissions.find(s => s.module_id === 3);
    if (modul3 && modul3.payload?.projectName) {
      slide2.addText(`Proyek Kelompok:\n"${modul3.payload.projectName}"`, { x: 0.5, y: 4, w: 9, h: 1, fontSize: 20, bold: true, color: "065F46", fill: { color: "D1FAE5" } });
    }

        // 3. Susun Slide berdasarkan "Benang Merah" Peta Konsep
    const urutanModul = [1, 5, 2, 3, 4, 6, 7, 8, 9, 10];
    const judulModul = {
      1: "Landasan: Paradigma Baru Kepemimpinan",
      2: "Pengembangan: Kepemimpinan Transformasional",
      3: "Pengembangan: Leadership Communication",
      4: "Pengembangan: Emotional Intelligence & Profesionalisme",
      5: "Landasan: Ethical Leadership & Integritas",
      6: "Pengembangan: Strategic Leadership & Tata Kelola",
      7: "Pengembangan: Conflict Management & Collaborative",
      8: "Pengembangan: Mentoring & Coaching",
      9: "Pengembangan: Leading Change",
      10: "Hasil Akhir: Becoming Future Medical Education Leaders"
    };

    urutanModul.forEach((modId) => {
      const modData = submissions.filter(s => s.module_id === modId);
      
      if (modData.length === 0) return;

      let slide = pptx.addSlide();
      slide.addText(judulModul[modId as keyof typeof judulModul], { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true, color: "1E3A8A" });
      
      let yPos = 1.5;

      modData.forEach((sub, index) => {
        if (yPos > 4.5) return;

        let textContent = `${index + 1}. ${sub.payload?.name || 'Anonim'}:\n`;

        if (modId === 3) {
          textContent += `Temuan: ${sub.payload.temuan}\nUsulan: ${sub.payload.usulan}`;
        } else if (modId === 4) {
          textContent += `Skor EQ: ${sub.total_score}/80. Insight: ${sub.payload.learning_notes || '-'}`;
        } else if (modId === 6) {
          textContent += `Aspek: ${sub.payload.aspek}. Roadmap: ${sub.payload.action_plan}`;
        } else if (modId === 7) {
          textContent += `Solusi Konflik: ${sub.payload.langkah_resolusi}`;
        } else if (modId === 8) {
          textContent += `Goal: ${sub.payload.grow.goal}. Aksi: ${sub.payload.grow.will}`;
        } else {
          textContent += `Refleksi: ${sub.reflection || '-'}`;
        }

        slide.addText(textContent, { x: 0.5, y: yPos, w: 9, h: 1.2, fontSize: 12, fill: { color: "F1F5F9" } });
        yPos += 1.4;
      });
    });

    // 4. Simpan ke tabel group_artifacts (Supabase)
    await supabase.from('group_artifacts').insert({
      group_id: parseInt(groupId),
      file_name: `Hasil_Diskusi_Kelompok_${groupId}.pptx`,
    });

    // 5. Kirim file
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Kelompok_${groupId}_LDK.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("PPTX Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}