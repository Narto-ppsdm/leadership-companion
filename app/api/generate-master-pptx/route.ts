import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET() {
  try {
    // 1. Ambil data SWOT dari semua peserta
    const { data: swotData } = await supabase.from('individual_submissions').select('*').eq('module_id', 6);
    
    // 2. Ambil data Roadmap Kelompok
    const { data: roadmapData } = await supabase.from('group_project_data').select('*');

    // 3. Susun teks untuk AI (Kita ringkas biar gak kena limit token)
    let dataTeks = "DATA SELURUH KELOMPOK:\n";
    
    if (roadmapData) {
      roadmapData.forEach((r: any) => {
        dataTeks += `\n[KELOMPOK ${r.group_id}]\n`;
        dataTeks += `Judul Proyek: ${r.project_title || '-'}\n`;
        dataTeks += `Masalah: ${r.main_problem || '-'}\n`;
        dataTeks += `Roadmap 2027: ${r.roadmap_2027 || '-'}\n`;
        dataTeks += `Indikator: ${r.indicators || '-'}\n`;
      });
    }

    if (swotData) {
      dataTeks += `\nKumpulan Rencana Aksi (SWOT) Individu:\n`;
      swotData.forEach((s: any) => {
        dataTeks += `- ${s.payload?.action_plan}\n`;
      });
    }

    // 4. Minta AI untuk Mensintesis
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const prompt = `
      Kamu adalah Konsultan Strategis Pendidikan Tinggi.
      Di bawah ini adalah kumpulan data mentah dari 6 kelompok dosen FK UPNVJ. Mereka telah melakukan analisis SWOT dan menyusun Roadmap 2027-2030.
      
      DATA MENTAH:
      ${dataTeks}
      
      TUGASMU:
      Buat sebuah sintesis "MASTER BLUEPRINT RANCANGAN STRATEGIS FK UPNVJ 2027-2030" dalam format JSON (tanpa markdown \`\`\`json).
      Kamu harus mencari "benang merah" dari semua kelompok, membuang ide yang duplikat, dan menyusunnya menjadi satu dokumen besar.
      
      FORMAT JSON YANG DIMINTA:
      {
        "visi_2030": "Tuliskan 1 paragraf visi besar fakultas berdasarkan sintesis ide-ide mereka...",
        "masalah_kolektif": "Apa masalah utama yang paling sering muncul dari 6 kelompok ini?",
        "strategi_utama": ["Poin strategi 1", "Poin strategi 2", "Poin strategi 3"],
        "roadmap_2027": "Apa yang harus dilakukan fakultas di tahun 2027?",
        "roadmap_2030": "Apa target besar di tahun 2030?",
        "pesan_penutup": "1 kalimat motivasi untuk para pemimpin akademik."
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // 5. Bikin File PowerPoint
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // Slide 1: Cover
    let slide1 = pptx.addSlide();
    slide1.background = { color: "0F172A" }; // Navy elegan
    slide1.addText("MASTER BLUEPRINT", { x: 1, y: 2, w: 8, h: 1, fontSize: 44, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText("Rancangan Strategis Fakultas Kedokteran UPN \"Veteran\" Jakarta 2027-2030\n(Dihasilkan oleh AI dari Sintesis 6 Kelompok)", { x: 1, y: 3.2, w: 8, h: 1.5, fontSize: 20, color: "94A3B8", align: "center" });

    // Slide 2: Visi & Masalah
    let slide2 = pptx.addSlide();
    slide2.addText("Visi & Masalah Kolektif", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide2.addText(`Visi 2030:`, { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 18, bold: true, color: "065F46" });
    slide2.addText(aiData.visi_2030, { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 16, italic: true });
    slide2.addText(`Masalah Utama:`, { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 18, bold: true, color: "991B1B" });
    slide2.addText(aiData.masalah_kolektif, { x: 0.5, y: 4.3, w: 9, h: 1, fontSize: 16 });

    // Slide 3: Strategi Utama
    let slide3 = pptx.addSlide();
    slide3.addText("3 Strategi Utama", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide3.addText(aiData.strategi_utama.map((s: string, i: number) => `${i+1}. ${s}`).join('\n\n'), { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 20 });

    // Slide 4: Roadmap 2027-2030
    let slide4 = pptx.addSlide();
    slide4.addText("Roadmap Fakultas", { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide4.addText("Tahap 2027 (Fondasi):", { x: 0.5, y: 1.5, w: 9, h: 0.5, fontSize: 18, bold: true });
    slide4.addText(aiData.roadmap_2027, { x: 0.5, y: 2, w: 9, h: 1, fontSize: 16, fill: { color: "F1F5F9" } });
    slide4.addText("Target 2030 (Dampak):", { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 18, bold: true });
    slide4.addText(aiData.roadmap_2030, { x: 0.5, y: 3.8, w: 9, h: 1, fontSize: 16, fill: { color: "F1F5F9" } });

    slide4.addText(`"${aiData.pesan_penutup}"`, { x: 0.5, y: 5, w: 9, h: 0.5, fontSize: 14, italic: true, color: "475569", align: "center" });

    // 6. Simpan Log & Kirim File
    await supabase.from('master_blueprints').insert({
      file_name: `Master_Blueprint_AI_UPNVJ.pptx`,
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Master_Blueprint_AI_LDK.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("Master PPTX AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}