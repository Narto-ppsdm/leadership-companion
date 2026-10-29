import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId } = body;

    if (!groupId) return NextResponse.json({ error: 'Group ID required' }, { status: 400 });

    // 1. Ambil data SWOT (Modul 6) dari semua anggota kelompok
    const { data: swotData, error } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('module_id', 6)
      .eq('payload->>group', groupId);

    if (error) throw error;
    if (!swotData || swotData.length === 0) {
      return NextResponse.json({ error: 'Belum ada anggota kelompok yang mengisi SWOT (Modul 6).' }, { status: 400 });
    }

    // 2. Susun teks untuk AI
    let dataTeks = `Data SWOT Kelompok ${groupId}:\n`;
    swotData.forEach((s: any) => {
      dataTeks += `\n- Anggota: ${s.payload?.name}\n  Aspek: ${s.payload?.aspek}\n  Rencana Aksi: ${s.payload?.action_plan}\n`;
    });

    // 3. Minta AI nyusun draf Roadmap
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `
      Kamu adalah Konsultan Strategis Pendidikan Tinggi.
      Berikut adalah kumpulan usulan Rencana Aksi dari anggota kelompok ${groupId} di FK UPNVJ:
      ${dataTeks}
      
      Tugasmu: Sintesis semua ide ini menjadi satu Draf Roadmap Strategis 2027-2030 untuk kelompok ini.
      KEMBALIKAN DALAM FORMAT JSON (tanpa markdown \`\`\`json):
      {
        "project_title": "Judul proyek/agenda strategis utama kelompok ini...",
        "main_problem": "Masalah utama yang ingin diselesaikan...",
        "roadmap_2027": "Tahapan aksi di tahun 2027 (Fondasi)...",
        "roadmap_2028": "Tahapan aksi di tahun 2028...",
        "roadmap_2029": "Tahapan aksi di tahun 2029...",
        "roadmap_2030": "Target dampak di tahun 2030...",
        "indicators": "Indikator keberhasilan & PIC yang disarankan...",
        "risks": "Risiko utama & mitigasinya..."
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(text);

    return NextResponse.json({ data: aiData });

  } catch (error: any) {
    console.error("AI Roadmap Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}