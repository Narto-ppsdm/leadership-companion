import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Ambil semua data dari berbagai tabel
    const { data: submissions } = await supabase.from('individual_submissions').select('*');
    const { data: notes } = await supabase.from('other_module_notes').select('*');
    const { data: roadmaps } = await supabase.from('group_project_data').select('*');

    // 2. Bikin Workbook Excel
    const wb = XLSX.utils.book_new();

    // --- SHEET 1: DATA INDIVIDU (WLEIS, SWOT, dll) ---
    const formattedSubmissions = (submissions || []).map((s) => ({
      ID: s.id,
      Nama: s.payload?.name || 'Anonim',
      Kelompok: s.payload?.group || '-',
      'Modul ID': s.module_id,
      'Skor EQ': s.total_score || '-',
      'Jawaban Mentah': JSON.stringify(s.payload?.jawaban_mentah || s.payload?.answers || {}),
      'Isian Tambahan': JSON.stringify(s.payload || {}),
      'Respon AI': s.ai_feedback || '-',
      Refleksi: s.reflection || '-',
      Tanggal: new Date(s.created_at).toLocaleString('id-ID'),
    }));
    const wsSubmissions = XLSX.utils.json_to_sheet(formattedSubmissions);
    XLSX.utils.book_append_sheet(wb, wsSubmissions, 'Data Individu');

    // --- SHEET 2: DATA CATATAN PRIBADI ---
    const formattedNotes = (notes || []).map((n) => ({
      ID: n.id,
      Nama: n.user_id,
      Kelompok: n.group || '-',
      'Modul ID': n.module_id,
      'Catatan Insight': n.learning_notes || '-',
      'Respon AI': n.ai_feedback || '-',
      Refleksi: n.reflection || '-',
      Tanggal: new Date(n.created_at).toLocaleString('id-ID'),
    }));
    const wsNotes = XLSX.utils.json_to_sheet(formattedNotes);
    XLSX.utils.book_append_sheet(wb, wsNotes, 'Catatan Pribadi');

    // --- SHEET 3: DATA ROADMAP KELOMPOK ---
    const formattedRoadmaps = (roadmaps || []).map((r) => ({
      'Kelompok': r.group_id,
      'Judul Proyek': r.project_title || '-',
      'Masalah Utama': r.main_problem || '-',
      'Ringkasan Negosiasi': r.negotiation_summary || '-',
      'Roadmap 2027': r.roadmap_2027 || '-',
      'Roadmap 2028': r.roadmap_2028 || '-',
      'Roadmap 2029': r.roadmap_2029 || '-',
      'Roadmap 2030': r.roadmap_2030 || '-',
      'Indikator & PIC': r.indicators || '-',
      'Risiko & Mitigasi': r.risks || '-',
      'Terakhir Update': new Date(r.updated_at).toLocaleString('id-ID'),
    }));
    const wsRoadmaps = XLSX.utils.json_to_sheet(formattedRoadmaps);
    XLSX.utils.book_append_sheet(wb, wsRoadmaps, 'Roadmap Kelompok');

    // 3. Convert ke Buffer Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 4. Kirim sebagai File Download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Rekap_Data_LDK_UPNVJ.xlsx"',
      },
    });

  } catch (error: any) {
    console.error('Export Excel Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}