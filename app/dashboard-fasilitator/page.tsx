'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function FasilitatorPage() {
  const [wleisData, setWleisData] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tipe state activeTab ditambah 'ei-baru'
  const [activeTab, setActiveTab] = useState<'wleis' | 'notes' | 'swot' | 'roadmap' | 'ei-baru'>('wleis');
  
  const [swotData, setSwotData] = useState<any[]>([]);
  const [roadmapData, setRoadmapData] = useState<any[]>([]);
  const [eiBaruData, setEiBaruData] = useState<any[]>([]); // State baru buat EI

  // STATE UNTUK PASSWORD
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // State untuk Modal Detail
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  // State & Fungsi untuk Hapus Data
  const [isResetting, setIsResetting] = useState(false);

  // STATE UNTUK FITUR AI
  const [selectedMods, setSelectedMods] = useState<number[]>([1, 2, 6, 9, 10]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<string | null>(null);

  const handleResetData = async () => {
    const confirm1 = confirm('⚠️ PERINGATAN KERAS!\n\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA peserta, catatan, dan roadmap?\n\nTindakan ini tidak bisa dibatalkan!');
    if (!confirm1) return;

    const confirm2 = prompt('Ketik kata "HAPUS" (huruf besar) untuk melanjutkan:');
    if (confirm2 !== 'HAPUS') return alert('Konfirmasi gagal. Data tidak dihapus.');

    setIsResetting(true);
    try {
      const response = await fetch('/api/reset-data', { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      alert('Semua data berhasil dibersihkan!');
      fetchData(); 
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Cek apakah udah pernah login di browser ini
  useEffect(() => {
    const auth = localStorage.getItem('fasilitator_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLoginFasilitator = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'upnvj2026') { 
      setIsAuthenticated(true);
      localStorage.setItem('fasilitator_auth', 'true');
    } else {
      alert('Password salah!');
      setPasswordInput('');
    }
  };

  const handleCheckboxChange = (modId: number) => {
    if (selectedMods.includes(modId)) {
      setSelectedMods(selectedMods.filter(id => id !== modId));
    } else {
      setSelectedMods([...selectedMods, modId]);
    }
  };

  const handleGenerateStrategy = async () => {
    if (selectedMods.length === 0) return alert("Pilih minimal satu modul!");
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/generate-strategic-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: selectedMods })
      });
      const data = await response.json();
      if (data.feedback) setStrategicPlan(data.feedback);
      else alert("Gagal generate: " + (data.error || 'Unknown error'));
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Ambil data WLEIS (Modul 4 Lama)
    const { data: wleis } = await supabase.from('individual_submissions').select('*').eq('module_id', 4).order('created_at', { ascending: false });
    
    // 2. Ambil data Catatan Pribadi
    const { data: notes } = await supabase.from('other_module_notes').select('*').order('created_at', { ascending: false });

    // 3. Ambil data SWOT (Modul 6)
    const { data: swot } = await supabase.from('individual_submissions').select('*').eq('module_id', 6).order('created_at', { ascending: false });

    // 4. Ambil data Roadmap Kelompok
    const { data: roadmap } = await supabase.from('group_project_data').select('*').order('updated_at', { ascending: false });

    // 5. Ambil data Refleksi EI Baru (Modul 40)
    const { data: eiBaru } = await supabase.from('individual_submissions').select('*').eq('module_id', 40).order('created_at', { ascending: false });

    if (wleis) setWleisData(wleis);
    if (notes) setNotesData(notes);
    if (swot) setSwotData(swot);
    if (roadmap) setRoadmapData(roadmap);
    if (eiBaru) setEiBaruData(eiBaru);
    
    setIsLoading(false);
  };

  // Komponen Modal Pop-up
  const renderModal = () => {
    if (!selectedDetail) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-lg text-gray-800">Detail Data</h3>
            <button onClick={() => setSelectedDetail(null)} className="text-gray-500 hover:text-red-500 font-bold text-xl">&times;</button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
            {Object.entries(selectedDetail).map(([key, value]) => (
              <div key={key}>
                <p className="font-semibold text-gray-500 uppercase text-xs mb-1">{key.replace(/_/g, ' ')}</p>
                <p className="bg-gray-50 p-3 rounded border">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value) || '-'}
                </p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t text-right">
            <button onClick={() => setSelectedDetail(null)} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition">Tutup</button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // JIKA BELUM LOGIN, TAMPILKAN LAYAR KUNCI
  // ==========================================
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-t-4 border-green-500">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Akses Fasilitator</h1>
          <p className="text-center text-sm text-gray-500 mb-6">Halaman ini khusus untuk panitia/narasumber LDK.</p>
          
          <form onSubmit={handleLoginFasilitator} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masukkan Password Fasilitator</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg p-3 text-base text-black focus:ring-2 focus:ring-green-500" 
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">
              Buka Dashboard
            </button>
            <Link href="/" className="block text-center text-gray-500 text-sm hover:underline mt-2">
              &larr; Kembali ke Beranda
            </Link>
          </form>
        </div>
      </main>
    );
  }

  // ==========================================
  // JIKA SUDAH LOGIN, TAMPILKAN DASHBOARD
  // ==========================================
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex justify-between items-center border-l-4 border-green-500">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Dashboard Fasilitator</h1>
            <p className="text-gray-500">Pantau progres peserta LDK FK UPNVJ</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={handleResetData}
              disabled={isResetting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
            >
              {isResetting ? 'Menghapus...' : '🗑️ Hapus Data'}
            </button>
            <a href="/api/generate-master-pptx" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              📥 Generate Master PPTX
            </a>
            <button 
              onClick={() => {
                localStorage.removeItem('fasilitator_auth');
                setIsAuthenticated(false);
              }} 
              className="text-red-500 text-sm font-semibold hover:underline"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total WLEIS (Lama)</h3>
            <p className="text-3xl font-bold text-blue-800">{wleisData.length} <span className="text-sm text-gray-400 font-normal">Peserta</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Catatan Lain</h3>
            <p className="text-3xl font-bold text-green-700">{notesData.length} <span className="text-sm text-gray-400 font-normal">Catatan</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total SWOT</h3>
            <p className="text-3xl font-bold text-indigo-700">{swotData.length} <span className="text-sm text-gray-400 font-normal">Analisis</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center gap-2">
             <button onClick={fetchData} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition">
                🔄 Refresh Data
             </button>
             <a href="/api/export-data" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition flex items-center gap-1">
               📊 Export Excel
             </a>
          </div>
        </div>

        {/* Kotak AI Strategic Plan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">AI Strategic Plan</h2>
          <p className="text-sm text-gray-500 mb-4">Pilih modul yang ingin dianalisis oleh AI untuk menyusun Rancangan Strategis Fakultas.</p>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((modId) => (
              <label key={modId} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                <input type="checkbox" checked={selectedMods.includes(modId)} onChange={() => handleCheckboxChange(modId)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700">Modul {modId}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={handleGenerateStrategy} disabled={isAnalyzing} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50">
              {isAnalyzing ? 'AI Sedang Menganalisis...' : '✨ Generate Rancangan Strategis'}
            </button>
            <button onClick={() => { window.location.href = `/api/generate-strategic-pptx?modules=${selectedMods.join(',')}`; }} disabled={isAnalyzing || selectedMods.length === 0} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50">
              📥 Download Rancangan (PPTX)
            </button>
          </div>
        </div>

        {/* Tampilan Hasil AI */}
        {strategicPlan && (
          <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200 mb-6 animate-in fade-in">
            <h2 className="text-lg font-bold text-blue-800 mb-4">Hasil Rancangan Strategis</h2>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
              {strategicPlan}
            </div>
          </div>
        )}

        {/* Tabs Navigasi */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveTab('ei-baru')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'ei-baru' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Refleksi EI (Baru)
          </button>
          <button onClick={() => setActiveTab('wleis')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'wleis' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Data WLEIS (Lama)
          </button>
          <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'notes' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Catatan Materi Lain
          </button>
          <button onClick={() => setActiveTab('swot')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'swot' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Data SWOT (Modul 6)
          </button>
          <button onClick={() => setActiveTab('roadmap')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'roadmap' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Roadmap Kelompok
          </button>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Memuat data...</div>
          ) : activeTab === 'ei-baru' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nama Peserta</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Kelompok</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Fokus Latihan</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Tindakan Konkret</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {eiBaruData.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data Refleksi EI (Baru) yang masuk.</td></tr>
                  ) : (
                    eiBaruData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{row.payload?.name || 'Anonim'}</td>
                        <td className="p-4 text-gray-600">Kelompok {row.payload?.group || '-'}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.payload?.fokus}>{row.payload?.fokus || '-'}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.payload?.tindakan}>{row.payload?.tindakan || '-'}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedDetail({ 
                              Nama: row.payload?.name, 
                              Kelompok: row.payload?.group, 
                              'Skor Dimensi': row.payload?.skor_dimensi, 
                              'Kekuatan Pribadi': row.payload?.kekuatan,
                              'Fokus Latihan': row.payload?.fokus,
                              'Tindakan Konkret': row.payload?.tindakan,
                              'Situasi Pemicu': row.payload?.pemicu,
                              'Strategi Pribadi': row.payload?.strategi,
                              'Respon AI': row.ai_feedback,
                              Refleksi: row.reflection
                            })} 
                            className="bg-teal-100 text-teal-700 px-3 py-1 rounded text-xs font-semibold hover:bg-teal-200"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'wleis' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nama Peserta</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Kelompok</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Skor EQ</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Respon AI</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {wleisData.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data WLEIS yang masuk.</td></tr>
                  ) : (
                    wleisData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{row.payload?.name || 'Anonim'}</td>
                        <td className="p-4 text-gray-600">Kelompok {row.payload?.group || '-'}</td>
                        <td className="p-4 font-bold text-blue-600">{row.total_score} / 80</td>
                        <td className="p-4 text-sm text-gray-600 max-w-md truncate" title={row.ai_feedback}>{row.ai_feedback}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedDetail({ Nama: row.payload?.name, Kelompok: row.payload?.group, Skor: row.total_score, 'Respon AI': row.ai_feedback, 'Jawaban': row.payload?.answers })} 
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-200"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'notes' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nama Peserta</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Modul</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Catatan Insight</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Refleksi</th>
                  </tr>
                </thead>
                <tbody>
                  {notesData.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">Belum ada Catatan Pribadi yang masuk.</td></tr>
                  ) : (
                    notesData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{row.user_id}</td>
                        <td className="p-4 text-gray-600">Modul {row.module_id}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.learning_notes}>{row.learning_notes}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.reflection}>{row.reflection}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'swot' ? (
            /* TABEL SWOT BARU */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nama Peserta</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Aspek</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Rencana Aksi (Roadmap)</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Respon AI</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {swotData.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data SWOT yang masuk.</td></tr>
                  ) : (
                    swotData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{row.payload?.name || 'Anonim'}</td>
                        <td className="p-4 text-gray-600">{row.payload?.aspek || '-'}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-md truncate" title={row.payload?.action_plan}>{row.payload?.action_plan}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-md truncate" title={row.ai_feedback}>{row.ai_feedback}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedDetail({ Nama: row.payload?.name, Aspek: row.payload?.aspek, Strength: row.payload?.swot?.strength, Weakness: row.payload?.swot?.weakness, Opportunity: row.payload?.swot?.opportunity, Threat: row.payload?.swot?.threat, 'Rencana Aksi': row.payload?.action_plan, 'Respon AI': row.ai_feedback })} 
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-semibold hover:bg-indigo-200"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABEL ROADMAP KELOMPOK BARU */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Kelompok</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Judul Proyek</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Roadmap 2027</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Indikator & PIC</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmapData.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada data Roadmap Kelompok yang masuk.</td></tr>
                  ) : (
                    roadmapData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-bold text-purple-700">Kelompok {row.group_id}</td>
                        <td className="p-4 font-medium text-gray-800">{row.project_title}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.roadmap_2027}>{row.roadmap_2027}</td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.indicators}>{row.indicators}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedDetail({ Kelompok: row.group_id, 'Judul Proyek': row.project_title, Masalah: row.main_problem, Negosiasi: row.negotiation_summary, 'Roadmap 2027': row.roadmap_2027, 'Roadmap 2028': row.roadmap_2028, 'Roadmap 2029': row.roadmap_2029, 'Roadmap 2030': row.roadmap_2030, 'Indikator & PIC': row.indicators, 'Risiko & Mitigasi': row.risks })} 
                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs font-semibold hover:bg-purple-200"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      
      {/* PANGGIL MODAL DI SINI */}
      {renderModal()}

    </main>
  );
}