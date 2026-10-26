'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

export default function FasilitatorPage() {
  const [wleisData, setWleisData] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wleis' | 'notes'>('wleis');

  // STATE UNTUK PASSWORD
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // STATE UNTUK FITUR AI
  const [selectedMods, setSelectedMods] = useState<number[]>([1, 2, 6, 9, 10]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<string | null>(null);

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
    
    // Ambil data WLEIS
    const { data: wleis } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('module_id', 4)
      .order('created_at', { ascending: false });

    // Ambil data Catatan Pribadi
    const { data: notes } = await supabase
      .from('other_module_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (wleis) setWleisData(wleis);
    if (notes) setNotesData(notes);
    
    setIsLoading(false);
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
            <button 
              type="submit" 
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
            >
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
            <a 
              href="/api/generate-master-pptx" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Ikut WLEIS</h3>
            <p className="text-3xl font-bold text-blue-800">{wleisData.length} <span className="text-sm text-gray-400 font-normal">Peserta</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Catatan Materi Lain</h3>
            <p className="text-3xl font-bold text-green-700">{notesData.length} <span className="text-sm text-gray-400 font-normal">Catatan</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center gap-2">
             <button onClick={fetchData} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition">
                🔄 Refresh Data
             </button>
             <a href="/api/generate-pptx" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                📥 Download PPTX
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
                <input 
                  type="checkbox" 
                  checked={selectedMods.includes(modId)}
                  onChange={() => handleCheckboxChange(modId)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Modul {modId}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleGenerateStrategy}
              disabled={isAnalyzing}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isAnalyzing ? 'AI Sedang Menganalisis...' : '✨ Generate Rancangan Strategis'}
            </button>
            <button 
              onClick={() => {
                window.location.href = `/api/generate-strategic-pptx?modules=${selectedMods.join(',')}`;
              }}
              disabled={isAnalyzing || selectedMods.length === 0}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
            >
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
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setActiveTab('wleis')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'wleis' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Data WLEIS (EQ)
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${activeTab === 'notes' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Catatan Materi Lain
          </button>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Memuat data...</div>
          ) : activeTab === 'wleis' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nama Peserta</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Kelompok</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Skor EQ</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Respon AI</th>
                  </tr>
                </thead>
                <tbody>
                  {wleisData.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">Belum ada data WLEIS yang masuk.</td></tr>
                  ) : (
                    wleisData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{row.payload?.name || 'Anonim'}</td>
                        <td className="p-4 text-gray-600">Kelompok {row.payload?.group || '-'}</td>
                        <td className="p-4 font-bold text-blue-600">{row.total_score} / 80</td>
                        <td className="p-4 text-sm text-gray-600 max-w-md truncate" title={row.ai_feedback}>
                          {row.ai_feedback}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
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
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.learning_notes}>
                          {row.learning_notes}
                        </td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={row.reflection}>
                          {row.reflection}
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
    </main>
  );
}