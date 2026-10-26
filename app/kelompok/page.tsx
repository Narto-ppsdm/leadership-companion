'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function KelompokPage() {
  const [group, setGroup] = useState('1');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedGroup = localStorage.getItem('peserta_group') || '1';
    setGroup(savedGroup);
    fetchGroupData(savedGroup);
  }, []);

  const fetchGroupData = async (grp: string) => {
    setIsLoading(true);
    
    // 1. Ambil data modul khusus (3,4,6,7,8)
    const { data: submissionsData } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('payload->>group', grp);
    
    // 2. Ambil data Catatan Pribadi (1,2,5,9,10)
    const { data: notesData } = await supabase
      .from('other_module_notes')
      .select('*')
      .eq('group', grp); // Filter berdasarkan kelompok

    // 3. Gabungkan dua-duanya
    const combinedData = [
      ...(submissionsData || []),
      ...(notesData || []).map((note: any) => ({
        module_id: note.module_id,
        payload: { name: note.user_id }, // Ambil nama dari user_id
        reflection: note.reflection,
        isNote: true
      }))
    ];

    // 4. Urutkan berdasarkan nomor modul (1, 3, 4, dst)
    combinedData.sort((a, b) => a.module_id - b.module_id);

    setSubmissions(combinedData);
    setIsLoading(false);
  };

  const handleGenerateGroupPPT = async () => {
    setIsGenerating(true);
    try {
      // Nanti kita sambungin ke API generate-pptx-kelompok
      window.location.href = `/api/generate-pptx-kelompok?group=${group}`;
    } catch (error) {
      alert('Gagal generate PPT');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md">
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-4 inline-block">&larr; Kembali ke Dashboard</Link>
        
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Ruang Diskusi Kelompok {group}</h1>
        <p className="text-gray-500 mb-8">Kumpulan hasil pembelajaran dan refleksi dari seluruh anggota kelompok Anda.</p>

        {isLoading ? (
          <p className="text-center text-gray-500">Memuat data kelompok...</p>
        ) : (
          <div className="space-y-4 mb-8">
            {submissions.length === 0 ? (
              <p className="text-gray-500 italic">Belum ada anggota kelompok yang mengisi form.</p>
            ) : (
              submissions.map((sub, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{sub.payload?.name || 'Anonim'}</h3>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">Modul {sub.module_id}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2"><strong>Refleksi:</strong> {sub.reflection || '-'}</p>
                </div>
              ))
            )}
          </div>
        )}

        <div className="border-t pt-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Susun Artefak Kelompok</h2>
          <p className="text-sm text-gray-500 mb-4">Klik tombol di bawah ini untuk menggabungkan seluruh hasil diskusi kelompok Anda menjadi satu file presentasi PowerPoint.</p>
          <button 
            onClick={handleGenerateGroupPPT} 
            disabled={isGenerating || submissions.length === 0}
            className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
          >
            {isGenerating ? 'Menyusun Slide...' : '📥 Generate Slide Presentasi Kelompok'}
          </button>
        </div>
      </div>
    </main>
  );
}