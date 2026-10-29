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

    // STATE ROADMAP KELOMPOK
  const [projectTitle, setProjectTitle] = useState('');
  const [mainProblem, setMainProblem] = useState('');
  const [negosiasi, setNegosiasi] = useState('');
  const [th2027, setTh2027] = useState('');
  const [th2028, setTh2028] = useState('');
  const [th2029, setTh2029] = useState('');
  const [th2030, setTh2030] = useState('');
  const [indicators, setIndicators] = useState('');
  const [risks, setRisks] = useState('');
  const [isSavingProj, setIsSavingProj] = useState(false);

  // Load data roadmap kalau udah pernah disimpan
  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase.from('group_project_data').select('*').eq('group_id', group).single();
      if (data) {
        setProjectTitle(data.project_title || '');
        setMainProblem(data.main_problem || '');
        setNegosiasi(data.negotiation_summary || '');
        setTh2027(data.roadmap_2027 || '');
        setTh2028(data.roadmap_2028 || '');
        setTh2029(data.roadmap_2029 || '');
        setTh2030(data.roadmap_2030 || '');
        setIndicators(data.indicators || '');
        setRisks(data.risks || '');
      }
    };
    if (group) fetchProject();
  }, [group]);

  // Fungsi Simpan
  const handleSaveRoadmap = async () => {
    setIsSavingProj(true);
    const payload = {
      group_id: group,
      project_title: projectTitle,
      main_problem: mainProblem,
      negotiation_summary: negosiasi,
      roadmap_2027: th2027, roadmap_2028: th2028, roadmap_2029: th2029, roadmap_2030: th2030,
      indicators: indicators, risks: risks,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('group_project_data').upsert(payload, { onConflict: 'group_id' });
    if (error) alert('Gagal simpan: ' + error.message);
    else alert('Data Roadmap Kelompok berhasil disimpan!');
    setIsSavingProj(false);
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
      </div>

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
                  {/* FORM ROADMAP KELOMPOK (LK 01, 03, 06) */}
        <div className="mt-12 bg-white p-6 md:p-8 rounded-xl shadow-md border-t-4 border-indigo-600">
          <h2 className="text-xl font-bold text-indigo-800 mb-2">Kesepakatan & Roadmap Kelompok</h2>
          <p className="text-sm text-gray-500 mb-6">Isi bagian ini dengan hasil diskusi dan *game* kelompok Anda. Data ini akan otomatis masuk ke file PowerPoint.</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">1. Judul Proyek & Masalah Utama (LK 01)</label>
              <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="w-full border rounded-lg p-3 text-sm mb-2" placeholder="Judul Proyek..." />
              <textarea value={mainProblem} onChange={(e) => setMainProblem(e.target.value)} className="w-full border rounded-lg p-3 text-sm" placeholder="Apa masalah utama yang ingin diselesaikan?" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">2. Ringkasan Negosiasi (LK 03 & 07)</label>
              <textarea value={negosiasi} onChange={(e) => setNegosiasi(e.target.value)} className="w-full border rounded-lg p-3 text-sm" placeholder="Misal: Sepakat dengan Kelompok 6 untuk berbagi sumber daya RS Jejaring..." />
            </div>

            <div className="border p-4 rounded-lg bg-indigo-50/50">
              <label className="block text-sm font-bold text-indigo-900 mb-3">3. Roadmap Indikator 2027-2030 (LK 06)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-600">2027</label><textarea value={th2027} onChange={(e) => setTh2027(e.target.value)} className="w-full border rounded p-2 text-xs" /></div>
                <div><label className="text-xs font-semibold text-gray-600">2028</label><textarea value={th2028} onChange={(e) => setTh2028(e.target.value)} className="w-full border rounded p-2 text-xs" /></div>
                <div><label className="text-xs font-semibold text-gray-600">2029</label><textarea value={th2029} onChange={(e) => setTh2029(e.target.value)} className="w-full border rounded p-2 text-xs" /></div>
                <div><label className="text-xs font-semibold text-gray-600">2030</label><textarea value={th2030} onChange={(e) => setTh2030(e.target.value)} className="w-full border rounded p-2 text-xs" /></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">4. Indikator Keberhasilan, PIC & Risiko</label>
              <textarea value={indicators} onChange={(e) => setIndicators(e.target.value)} className="w-full border rounded-lg p-3 text-sm mb-2" placeholder="Indikator & PIC..." />
              <textarea value={risks} onChange={(e) => setRisks(e.target.value)} className="w-full border rounded-lg p-3 text-sm" placeholder="Risiko & Mitigasi..." />
            </div>
          </div>

          <button onClick={handleSaveRoadmap} disabled={isSavingProj} className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold hover:bg-indigo-700 transition">
            {isSavingProj ? 'Menyimpan...' : '💾 Simpan Data Roadmap'}
          </button>
        </div>
        </div>
    </main>
  );
}