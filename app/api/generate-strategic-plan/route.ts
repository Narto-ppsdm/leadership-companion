import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Ubah jadi POST karena kita kirim data array modul dari frontend
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const selectedModules = body.modules || [1, 2, 6, 9, 10]; // Default kalau kosong

    // 1. Ambil data hanya untuk modul yang dicentang
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
      // Ambil 1 sampel data per modul untuk kelompok ini
      selectedModules.forEach((modId: number) => {
        const modData = submissions.find((s: any) => s.payload?.group === grp && s.module_id === modId);
        if (modData) {
          if (modData.payload?.action_plan) dataTeks += `- [Modul ${modId}] Rencana Aksi: ${modData.payload.action_plan}\n`;
          if (modData.reflection) dataTeks += `- [Modul ${modId}] Refleksi: ${modData.reflection}\n`;
          if (modData.payload?.learning_notes) dataTeks += `- [Modul ${modId}] Insight: ${modData.payload.learning_notes}\n`;
        }
      });
    });

    // 3. Prompt AI
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' }); // Ganti ke 2.5-flash jika perlu
    const prompt = `
      Kamu adalah Konsultan Strategis Pendidikan Tinggi. 
      Di bawah ini adalah kumpulan hasil pemikiran dosen-dosen dari beberapa kelompok di FK UPNVJ berdasarkan modul yang dipilih.
      
      DATA PESERTA:
      ${dataTeks}
      
      TUGASMU:
      Buatlah sebuah "RANCANGAN STRATEGIS FK UPNVJ 2027-2030" (maksimal 400 kata) yang merangkum semuanya.
      Gunakan format markdown yang rapi dengan poin-poin:
      1. Visi Utama
      2. 3 Program Prioritas
      3. Strategi Implementasi
      4. Pesan Kunci Kepemimpinan
      
      Gunakan bahasa yang formal, visioner, dan inspiratif khas dokumen institusi.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ feedback: text });

  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}