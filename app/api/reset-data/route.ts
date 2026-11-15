import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(req: Request) {
  try {
    // Hapus semua data di tabel-tabel utama
    const { error: err1 } = await supabase.from('individual_submissions').delete().neq('id', 0); 
    const { error: err2 } = await supabase.from('other_module_notes').delete().neq('id', 0);
    const { error: err3 } = await supabase.from('group_project_data').delete().neq('id', 0);
    const { error: err4 } = await supabase.from('group_artifacts').delete().neq('id', 0);

    if (err1 || err2 || err3 || err4) throw new Error('Gagal menghapus beberapa data.');

    return NextResponse.json({ message: 'Semua data berhasil dihapus!' });

  } catch (error: any) {
    console.error('Reset Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}