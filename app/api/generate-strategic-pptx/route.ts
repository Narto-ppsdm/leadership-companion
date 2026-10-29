import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import pptxgen from 'pptxgenjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modsString = searchParams.get('modules');
    const selectedModules = modsString ? modsString.split(',').map(Number) : [1, 2, 6, 9, 10];

    // 1. Ambil data dari Supabase
    const { data: submissions, error } = await supabase
      .from('individual_submissions')
      .select('*')
      .in('module_id', selectedModules);

    if (error) throw error;

    // 2. Susun teks untuk AI
    let dataTeks = "";
    const groups = [...new Set(submissions.map((s: any) => s.payload?.group))].sort();

    groups.forEach((grp: any) => {
      dataTeks += `\n=== DATA KELOMPOK ${grp} ===\n`;
      selectedModules.forEach((modId: number) => {
        const modData = submissions.find((s: any) => s.payload?.group === grp && s.module_id === modId);
        if (modData) {
          if (modData.payload?.action_plan) dataTeks += `- Rencana Aksi: ${modData.payload.action_plan}\n`;
          if (modData.reflection) dataTeks += `- Refleksi: ${modData.reflection}\n`;
        }
      });
    });

    // 3. Prompt AI (Kita minta output berupa format JSON biar gampang di-parsing)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' }); // Pastikan ganti ke 3.5-flash jika perlu
    const prompt = `
      Kamu adalah Konsultan Strategis Pendidikan Tinggi. 
      Berdasarkan data dari kelompok-kelompok dosen FK UPNVJ berikut:
      ${dataTeks}
      
      Buatkan "RANCANGAN STRATEGIS FK UPNVJ 2027-2030".
      KEMBALIKAN JAWABAN HANYA DALAM FORMAT JSON SEPERTI INI (tanpa teks pembuka/penutup):
      {
        "visi": "Teks visi utama...",
        "program_prioritas": ["Program 1", "Program 2", "Program 3"],
        "strategi_implementasi": "Teks strategi...",
        "pesan_kunci": "Teks pesan..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Bersihkan format markdown (```json ... ```) jika ada
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // 4. Bikin File PowerPoint dari hasil AI
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // Slide 1: Cover
    let slide1 = pptx.addSlide();
    slide1.background = { color: "0F172A" };
    slide1.addText("RANCANGAN STRATEGIS", { x: 1, y: 2, w: 8, h: 1, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText("FK UPN \"Veteran\" Jakarta 2027-2030\n(Dihasilkan oleh AI)", { x: 1, y: 3.2, w: 8, h: 1, fontSize: 20, color: "94A3B8", align: "center" });

    // Slide 2: Visi
    let slide2 = pptx.addSlide();
    slide2.addText("Visi Utama", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 32, bold: true, color: "1E3A8A" });
    slide2.addText(aiData.visi, { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 20, italic: true, color: "333333" });

    // Slide 3: Program Prioritas
    let slide3 = pptx.addSlide();
    slide3.addText("3 Program Prioritas", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 32, bold: true, color: "1E3A8A" });
    slide3.addText(aiData.program_prioritas.map((p: string, i: number) => `${i+1}. ${p}`).join('\n\n'), { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 20 });

    // Slide 4: Strategi & Pesan Kunci
    let slide4 = pptx.addSlide();
    slide4.addText("Strategi Implementasi", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide4.addText(aiData.strategi_implementasi, { x: 0.5, y: 1.2, w: 9, h: 2, fontSize: 18 });
    slide4.addText("Pesan Kunci Kepemimpinan", { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "065F46" });
    slide4.addText(aiData.pesan_kunci, { x: 0.5, y: 4.0, w: 9, h: 1, fontSize: 16, italic: true });

    // 5. Kirim file
    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Rancangan_Strategis_AI.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("PPTX AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}