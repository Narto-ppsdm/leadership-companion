'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const dataProyek = {
  '1': { title: 'Komunikasi dan Koordinasi Akademik', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
  '2': { title: 'Umpan Balik Akademik yang Membangun', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
  '3': { title: 'Penyelesaian Perbedaan dan Kesepakatan', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
  '4': { title: 'Mentoring Dosen', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
  '5': { title: 'Coaching untuk Pengembangan Dosen', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
  '6': { title: 'Koordinasi, Tata Kelola, dan Evaluasi', focus: ['Mengenali diri', 'Mengelola diri', 'Empati', 'Kesadaran sosial', 'Ruang aman', 'Mengelola ego'] },
};

export default function Modul3EntryPage() {
  const router = useRouter();
  const group = typeof window !== 'undefined' ? localStorage.getItem('peserta_group') || '1' : '1';
  const name = typeof window !== 'undefined' ? localStorage.getItem('peserta_name') || 'Anonim' : 'Anonim';
  
  const proyek = dataProyek[group as keyof typeof dataProyek];

  const [focus, setFocus] = useState(proyek.focus[0]);
  const [temuan, setTemuan] = useState('');
  const [usulan, setUsulan] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetAI = async () => {
    if (!temuan.trim() || !usulan.trim()) return alert("Mohon isi temuan dan usulan Anda.");
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'individu-materi', 
          group, 
          projectName: proyek.title, 
          focus, 
          temuan, 
          usulan 
        })
      });
      const data = await response.json();
      setAiFeedback(data.feedback);
    } catch (error) {
      alert("Gagal meminta respon AI.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAll = async () => {
    if (!reflection.trim()) return alert("Mohon isi refleksi pribadi Anda.");
    setIsSubmitting(true);
    try {
      await supabase.from('individual_submissions').insert({
        module_id: 3,
        payload: { 
          name, group, focus, temuan, usulan, projectName: proyek.title 
        },
        ai_feedback: aiFeedback,
        reflection: reflection,
        is_completed: true
      });
      alert("Kontribusi dan Refleksi berhasil disimpan!");
      router.push('/');
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <button onClick={() => router.push('/')} className="text-blue-600 mb-4 text-sm hover:underline">&larr; Kembali ke Dashboard</button>
        
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Modul 3: Leadership Communication</h1>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <p className="text-sm text-blue-800 font-semibold">Proyek Kelompok Anda:</p>
          <p className="text-lg text-blue-900 font-bold">{proyek.title}</p>
        </div>

        {/* BAGIAN 1: KONTRIBUSI INDIVIDU */}
        <h2 className="font-bold text-lg mb-3">1. Kontribusi Saya (Pasca Diskusi)</h2>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fokus Pengamatan</label>
            <select value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-black">
              {proyek.focus.map((f, i) => <option key={i} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temuan / Insight (1-3 kalimat)</label>
            <textarea value={temuan} onChange={(e) => setTemuan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-black h-24" placeholder="Apa yang Anda temukan dari aktivitas ini?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usulan Tindakan / Kalimat Konkret</label>
            <textarea value={usulan} onChange={(e) => setUsulan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-black h-24" placeholder="Apa tindakan nyata yang bisa dilakukan?" />
          </div>
          
          <button onClick={handleGetAI} disabled={isSubmitting || !temuan || !usulan} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {isSubmitting ? 'Meminta AI...' : '✨ Minta Review AI'}
          </button>

          {aiFeedback && (
            <div className="bg-green-50 p-4 border-l-4 border-green-500 rounded-md">
              <h3 className="font-bold text-green-800 mb-1">Review AI:</h3>
              <p className="text-gray-700 text-sm italic">" {aiFeedback} "</p>
            </div>
          )}
        </div>

        {/* BAGIAN 2: REFLEKSI PRIBADI */}
        <h2 className="font-bold text-lg mb-3">2. Refleksi Pribadi (Untuk RTL Anda)</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Apa yang akan Anda ubah/coba dari cara Anda memimpin setelah materi ini?</label>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-black h-24" placeholder="Tuliskan refleksi mendalam Anda di sini..." />
        </div>

        <button onClick={handleSaveAll} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
          {isSubmitting ? 'Menyimpan...' : 'Simpan Kontribusi & Refleksi'}
        </button>
      </div>
    </main>
  );
}