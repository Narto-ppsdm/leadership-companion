'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function Modul6Page() {
  const router = useRouter();
  const [name, setName] = useState('Anonim');
  const [group, setGroup] = useState('1');
  const [isHydrated, setIsHydrated] = useState(false);

  // State Form
  const [aspek, setAspek] = useState('Tata Kelola Akademik');
  const [strength, setStrength] = useState('');
  const [weakness, setWeakness] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [threat, setThreat] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [reflection, setReflection] = useState('');

  // State AI & Submit
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem('peserta_name') || 'Anonim');
    setGroup(localStorage.getItem('peserta_group') || '1');
    setIsHydrated(true);
  }, []);

  const handleGetAI = async () => {
    if (!strength.trim() || !weakness.trim() || !opportunity.trim() || !threat.trim() || !actionPlan.trim()) {
      return alert('Mohon isi semua kolom SWOT dan Usulan Program Kerja.');
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'strategic-swot',
          aspek,
          strength,
          weakness,
          opportunity,
          threat,
          actionPlan,
        }),
      });
      const data = await response.json();
      setAiFeedback(data.feedback);
    } catch {
      alert('Gagal meminta respon AI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!reflection.trim()) return alert('Mohon isi refleksi pribadi Anda.');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('individual_submissions').insert({
        module_id: 6,
        payload: {
          name,
          group,
          aspek,
          swot: { strength, weakness, opportunity, threat },
          action_plan: actionPlan,
        },
        ai_feedback: aiFeedback,
        reflection: reflection,
        is_completed: true,
      });
      if (error) throw error;
      alert('Analisis Strategis & Refleksi berhasil disimpan!');
      router.push('/');
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto bg-white md:my-6 md:rounded-xl md:shadow-md">
        {/* Header Sticky */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b md:border-0 md:rounded-t-xl px-4 md:px-8 py-3 md:py-6">
          <button onClick={() => router.push('/')} className="text-blue-600 text-sm hover:underline flex items-center gap-1 min-h-[44px]">
            &larr; Kembali ke Dashboard
          </button>
          <h1 className="text-lg md:text-2xl font-bold text-blue-800 mt-1">Modul 6: Strategic Leadership & Tata Kelola</h1>
        </div>

        <div className="px-4 md:px-8 pb-8">
          <p className="text-xs md:text-sm text-gray-500 mb-6">Peserta: {name} | Kelompok: {group}</p>

          {/* BAGIAN 1: SWOT */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">1. Analisis SWOT</h2>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Aspek Tata Kelola</label>
              <select value={aspek} onChange={(e) => setAspek(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[44px] bg-white">
                <option value="Tata Kelola Akademik">Tata Kelola Akademik</option>
                <option value="SDM & Dosen">SDM & Dosen</option>
                <option value="Sarana Prasarana">Sarana Prasarana</option>
                <option value="Kemahasiswaan & Alumni">Kemahasiswaan & Alumni</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Strength (Kekuatan)</label>
              <textarea value={strength} onChange={(e) => setStrength(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[80px] resize-y" placeholder="Apa kekuatan aspek ini di fakultas Anda?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weakness (Kelemahan)</label>
              <textarea value={weakness} onChange={(e) => setWeakness(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[80px] resize-y" placeholder="Apa kelemahan yang perlu diperbaiki?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Opportunity (Peluang)</label>
              <textarea value={opportunity} onChange={(e) => setOpportunity(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[80px] resize-y" placeholder="Peluang apa yang bisa dimanfaatkan?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Threat (Ancaman)</label>
              <textarea value={threat} onChange={(e) => setThreat(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[80px] resize-y" placeholder="Ancaman apa yang perlu diwaspadai?" />
            </div>
          </div>

          {/* BAGIAN 2: RENCANA AKSI */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">2. Usulan Program Kerja</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">1 Program Konkret (6 Bulan ke Depan)</label>
            <textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Tuliskan Usulan Program Kerja  yang spesifik dan terukur..." />
          </div>

          <button onClick={handleGetAI} disabled={isSubmitting || !actionPlan.trim()} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px] mb-8">
            {isSubmitting ? 'Meminta AI...' : '✨ Minta Review AI (SWOT & Aksi)'}
          </button>

          {aiFeedback && (
            <div className="bg-green-50 p-4 border-l-4 border-green-500 rounded-md mb-8">
              <h3 className="font-bold text-green-800 mb-1 text-sm">Review AI:</h3>
              <p className="text-gray-700 text-sm italic leading-relaxed">"{aiFeedback}"</p>
            </div>
          )}

          {/* BAGIAN 3: REFLEKSI */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">3. Refleksi Pribadi (Untuk RTL Anda)</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apa yang akan Anda ubah/coba dari cara Anda memimpin setelah materi ini?</label>
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Tuliskan refleksi mendalam Anda..." />
          </div>
        </div>

        {/* Sticky Submit Bar */}
        <div className="fixed md:static bottom-0 left-0 right-0 md:px-8 md:pb-8 bg-white md:bg-transparent border-t md:border-0 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:shadow-none">
          <button onClick={handleSave} disabled={isSubmitting || !reflection.trim()} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px]">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Analisis & Refleksi'}
          </button>
        </div>
      </div>
    </main>
  );
}