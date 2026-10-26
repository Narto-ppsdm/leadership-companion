'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const skenarioKonflik = [
  "Bentrok jadwal antara dosen preklinik dan klinik yang membuat mahasiswa kebingungan.",
  "Konflik antar staf administrasi terkait pembagian tugas yang tidak merata di masa ujian.",
  "Seorang mahasiswa koas mengeluh di media sosial tentang perlakuan tidak adil dari dokter residen."
];

export default function Modul7Page() {
  const router = useRouter();
  const [name, setName] = useState('Anonim');
  const [group, setGroup] = useState('1');
  const [isHydrated, setIsHydrated] = useState(false);

  // State Form
  const [kasus, setKasus] = useState(skenarioKonflik[0]);
  const [akarMasalah, setAkarMasalah] = useState('');
  const [langkahResolusi, setLangkahResolusi] = useState('');
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
    if (!akarMasalah.trim() || !langkahResolusi.trim()) {
      return alert('Mohon isi akar masalah dan langkah resolusi.');
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'conflict-management',
          kasus,
          akarMasalah,
          langkahResolusi,
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
        module_id: 7,
        payload: {
          name,
          group,
          kasus,
          akar_masalah: akarMasalah,
          langkah_resolusi: langkahResolusi,
        },
        ai_feedback: aiFeedback,
        reflection: reflection,
        is_completed: true,
      });
      if (error) throw error;
      alert('Analisis Konflik & Refleksi berhasil disimpan!');
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
          <h1 className="text-lg md:text-2xl font-bold text-blue-800 mt-1">Modul 7: Conflict Management</h1>
        </div>

        <div className="px-4 md:px-8 pb-8">
          <p className="text-xs md:text-sm text-gray-500 mb-6">Peserta: {name} | Kelompok: {group}</p>

          {/* BAGIAN 1: STUDI KASUS */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">1. Analisis Situasi Konflik</h2>
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Skenario Konflik</label>
              <select value={kasus} onChange={(e) => setKasus(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[44px] bg-white">
                {skenarioKonflik.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apa Akar Masalah dari Konflik Ini?</label>
              <textarea value={akarMasalah} onChange={(e) => setAkarMasalah(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[100px] resize-y" placeholder="Coba bedah penyebab utamanya (misal: komunikasi, regulasi, atau ego)..." />
            </div>
          </div>

          {/* BAGIAN 2: LANGKAH RESOLUSI */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">2. Langkah Penyelesaian</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bagaimana langkah strategis Anda menyelesaikan konflik ini?</label>
            <textarea value={langkahResolusi} onChange={(e) => setLangkahResolusi(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Tuliskan langkah-langkah penyelesaian yang konkret..." />
          </div>

          <button onClick={handleGetAI} disabled={isSubmitting || !langkahResolusi.trim()} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px] mb-8">
            {isSubmitting ? 'Meminta AI...' : '✨ Minta Review AI'}
          </button>

          {aiFeedback && (
            <div className="bg-green-50 p-4 border-l-4 border-green-500 rounded-md mb-8">
              <h3 className="font-bold text-green-800 mb-1 text-sm">Review AI:</h3>
              <p className="text-gray-700 text-sm italic leading-relaxed">"{aiFeedback}"</p>
            </div>
          )}

          {/* BAGIAN 3: REFLEKSI */}
          <h2 className="font-bold text-base md:text-lg mb-3 text-gray-800">3. Refleksi Pribadi (RTL)</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apa yang akan Anda ubah dari cara Anda menangani konflik setelah materi ini?</label>
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