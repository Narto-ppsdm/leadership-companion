import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Ambil data dari Supabase
    const { data: submissions, error } = await supabase
      .from('individual_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Siapkan file PowerPoint
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // --- SLIDE 1: COVER ---
    let slide1 = pptx.addSlide();
    slide1.background = { color: "1E3A8A" }; // Biru gelap
    slide1.addText("MASTER BLUEPRINT", { x: 1, y: 2, w: 8, h: 1, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText("Hasil Latihan Dasar Kepemimpinan (LDK)\nFK UPN \"Veteran\" Jakarta", { x: 1, y: 3.2, w: 8, h: 1, fontSize: 20, color: "E2E8F0", align: "center" });

    // --- SLIDE 2: RINGKASAN DATA ---
    let slide2 = pptx.addSlide();
    slide2.addText("Ringkasan Partisipasi", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    
    const countWLEIS = submissions.filter(s => s.module_id === 4).length;
    const countModul6 = submissions.filter(s => s.module_id === 6).length;
    const countModul8 = submissions.filter(s => s.module_id === 8).length;

    slide2.addText(`• Total Asesmen WLEIS (Modul 4): ${countWLEIS} peserta`, { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 18 });
    slide2.addText(`• Total Analisis Strategis (Modul 6): ${countModul6} peserta`, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 18 });
    slide2.addText(`• Total Analisis Mentoring (Modul 8): ${countModul8} peserta`, { x: 0.5, y: 2.9, w: 9, h: 0.5, fontSize: 18 });

    // --- SLIDE 3: HIGHLIGHT SWOT (MODUL 6) ---
    const swotData = submissions.find(s => s.module_id === 6);
    if (swotData) {
      let slide3 = pptx.addSlide();
      slide3.addText(`Highlight Analisis Strategis`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
      slide3.addText(`Peserta: ${swotData.payload.name}`, { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 16, italic: true, color: "64748B" });
      slide3.addText(`Aspek: ${swotData.payload.aspek}`, { x: 0.5, y: 1.8, w: 9, h: 0.5, fontSize: 20, bold: true });
      
      slide3.addText(`Rencana Aksi:\n"${swotData.payload.action_plan}"`, { x: 0.5, y: 2.5, w: 9, h: 1.5, fontSize: 16, fill: { color: "F1F5F9" } });
      slide3.addText(`Review AI:\n"${swotData.ai_feedback}"`, { x: 0.5, y: 4.2, w: 9, h: 1.5, fontSize: 14, italic: true, color: "065F46" });
    }

    // --- SLIDE 4: HIGHLIGHT MENTORING (MODUL 8) ---
    const growData = submissions.find(s => s.module_id === 8);
    if (growData) {
      let slide4 = pptx.addSlide();
      slide4.addText(`Highlight Mentoring & Coaching`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
      slide4.addText(`Mentee: ${growData.payload.profil_mentee}`, { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 16, italic: true });
      
      slide4.addText(`Goal: ${growData.payload.grow.goal}`, { x: 0.5, y: 2.2, w: 9, h: 0.5, fontSize: 14, fill: { color: "F1F5F9" } });
      slide4.addText(`Will (Aksi): ${growData.payload.grow.will}`, { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 14, fill: { color: "F1F5F9" } });
    }

    // 3. Generate dan kirim file sebagai response
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="Master_Blueprint_LDK.pptx"',
      },
    });

  } catch (error: any) {
    console.error("PPTX Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}