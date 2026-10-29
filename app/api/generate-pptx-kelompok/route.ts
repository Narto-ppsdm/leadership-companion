import { NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('group');
    const moduleId = searchParams.get('module');

    if (!groupId) {
      return NextResponse.json({ error: 'Parameter group wajib diisi' }, { status: 400 });
    }

    // 1. Ambil data dari Supabase
    let query = supabase.from('individual_submissions').select('*').eq('payload->>group', groupId);
    if (moduleId && moduleId !== 'all') query = query.eq('module_id', parseInt(moduleId));
    const { data: subData } = await query;

    let queryNotes = supabase.from('other_module_notes').select('*').eq('group', groupId);
    if (moduleId && moduleId !== 'all') queryNotes = queryNotes.eq('module_id', parseInt(moduleId));
    const { data: notesData } = await queryNotes;

    const { data: projData } = await supabase.from('group_project_data').select('*').eq('group_id', groupId).single();

    // 2. Gabungkan data
    const submissions = [
      ...(subData || []),
      ...(notesData || []).map((n: any) => ({
        module_id: n.module_id,
        payload: { name: n.user_id },
        reflection: n.reflection,
        learning_notes: n.learning_notes
      }))
    ];

    // 3. Kirim ke AI untuk diringkas
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }); // Atau 2.5-flash
    
    // Susun teks data
    let dataTeks = `Data Kelompok ${groupId}:\n`;
    if (projData) {
      dataTeks += `Proyek: ${projData.project_title}\nMasalah: ${projData.main_problem}\nRoadmap 2027: ${projData.roadmap_2027}\nIndikator: ${projData.indicators}\n`;
    }
    
    // Tambahkan data SWOT dari individu jika ada
    const swotSub = submissions.filter(s => s.module_id === 6);
    swotSub.forEach(s => {
      dataTeks += `SWOT (${s.payload?.name}): ${s.payload?.action_plan}\n`;
    });

    const prompt = `
      Kamu adalah Konsultan Strategis Pendidikan Tinggi. 
      Rangkum data mentah dari kelompok dosen FK UPNVJ ini menjadi poin-poin presentasi PowerPoint yang padat, profesional, dan menggunakan bahasa akademik.
      
      DATA MENTAH:
      ${dataTeks}
      
      KEMBALIKAN DALAM FORMAT JSON (Tanpa markdown \`\`\`json):
      {
        "judul_proyek": "...",
        "masalah_utama": "...",
        "ringkasan_swot": "1-2 kalimat kesimpulan SWOT...",
        "roadmap_2027": "...",
        "roadmap_2030": "...",
        "indikator": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    // 4. Bikin File PowerPoint
    let pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // Slide 1: Cover
    let slide1 = pptx.addSlide();
    slide1.background = { color: "1E3A8A" };
    slide1.addText(`HASIL DISKUSI KELOMPOK ${groupId}`, { x: 1, y: 2, w: 8, h: 1, fontSize: 40, color: "FFFFFF", bold: true, align: "center" });
    slide1.addText(`Materi: ${moduleId || moduleId === 'all' ? 'Semua Modul' : 'Modul ' + moduleId}\nLDK FK UPN "Veteran" Jakarta`, { x: 1, y: 3.2, w: 8, h: 1, fontSize: 20, color: "E2E8F0", align: "center" });

    // Slide 2: Hasil AI (Proyek & Roadmap)
    let slide2 = pptx.addSlide();
    slide2.addText(`Ringkasan Proyek Kelompok`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide2.addText(`Judul Proyek: ${aiData.judul_proyek || '-'}\nMasalah Utama: ${aiData.masalah_utama || '-'}`, { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 18 });
    
    slide2.addText(`Strategi & SWOT:\n${aiData.ringkasan_swot || '-'}`, { x: 0.5, y: 3.2, w: 9, h: 1.5, fontSize: 16, fill: { color: "F1F5F9" } });

    // Slide 3: Roadmap AI
    let slide3 = pptx.addSlide();
    slide3.addText(`Roadmap Strategis 2027-2030`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E3A8A" });
    slide3.addText(`Tahap 2027:\n${aiData.roadmap_2027 || '-'}`, { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 16 });
    slide3.addText(`Tahap 2030:\n${aiData.roadmap_2030 || '-'}`, { x: 0.5, y: 3, w: 9, h: 1, fontSize: 16 });
    slide3.addText(`Indikator & PIC:\n${aiData.indikator || '-'}`, { x: 0.5, y: 4.2, w: 9, h: 1, fontSize: 14, italic: true });

    // 5. Simpan Log & Kirim File
    await supabase.from('group_artifacts').insert({
      group_id: parseInt(groupId),
      file_name: `Hasil_AI_Kelompok_${groupId}.pptx`,
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Kelompok_${groupId}_AI_Presentation.pptx"`,
      },
    });

  } catch (error: any) {
    console.error("PPTX AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}