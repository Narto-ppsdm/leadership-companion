'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

// Data 24 Pernyataan + Dimensinya
const pertanyaan = [
  // Self-awareness
  { no: 1, dim: 'Kesadaran Diri', teks: 'Saya mengenali emosi yang sedang saya rasakan ketika menghadapi persoalan akademik.' },
  { no: 2, dim: 'Kesadaran Diri', teks: 'Saya mengetahui situasi yang memicu perubahan emosi saya dalam pekerjaan.' },
  { no: 3, dim: 'Kesadaran Diri', teks: 'Saya menyadari ketika suasana hati saya memengaruhi cara saya menilai pendapat orang lain.' },
  { no: 4, dim: 'Kesadaran Diri', teks: 'Saya mengenali tanda awal ketegangan pada diri saya sebelum memberikan respons kepada orang lain.' },
  // Self-management
  { no: 5, dim: 'Pengelolaan Diri', teks: 'Saya mengambil jeda untuk menenangkan diri ketika emosi saya meningkat dalam pembahasan pekerjaan.' },
  { no: 6, dim: 'Pengelolaan Diri', teks: 'Saya menjaga cara berbicara tetap menghormati orang lain meskipun saya tidak setuju dengan pendapatnya.' },
  { no: 7, dim: 'Pengelolaan Diri', teks: 'Saya mampu mengembalikan fokus pada persoalan yang perlu diselesaikan setelah mengalami kekecewaan.' },
  { no: 8, dim: 'Pengelolaan Diri', teks: 'Saya memeriksa fakta sebelum mengambil keputusan ketika sedang marah atau berada dalam tekanan.' },
  // Empathy leadership
  { no: 9, dim: 'Kepemimpinan Empatik', teks: 'Saya mendengarkan penjelasan dosen, mahasiswa, atau tenaga kependidikan sampai selesai sebelum memberikan tanggapan.' },
  { no: 10, dim: 'Kepemimpinan Empatik', teks: 'Saya berusaha memahami persoalan dari sudut pandang orang yang mengalaminya.' },
  { no: 11, dim: 'Kepemimpinan Empatik', teks: 'Saya mengonfirmasi pemahaman saya tentang perasaan atau kesulitan orang lain sebelum memberikan saran.' },
  { no: 12, dim: 'Kepemimpinan Empatik', teks: 'Saya menyesuaikan dukungan yang saya berikan dengan kebutuhan orang yang sedang menghadapi kesulitan.' },
  // Social awareness
  { no: 13, dim: 'Kesadaran Sosial', teks: 'Saya memperhatikan anggota kelompok yang belum memperoleh kesempatan menyampaikan pendapat dalam diskusi.' },
  { no: 14, dim: 'Kesadaran Sosial', teks: 'Saya memperhatikan bagaimana perbedaan jabatan atau senioritas memengaruhi keberanian seseorang untuk berbicara.' },
  { no: 15, dim: 'Kesadaran Sosial', teks: 'Saya mencari tahu kepentingan pihak-pihak yang akan terdampak sebelum mengusulkan keputusan akademik.' },
  { no: 16, dim: 'Kesadaran Sosial', teks: 'Saya mempertimbangkan perbedaan beban kerja dan ketersediaan sumber daya ketika membahas pembagian tugas.' },
  // Psychological safety
  { no: 17, dim: 'Keamanan Psikologis', teks: 'Saya mengundang anggota kelompok untuk menyampaikan pendapat yang berbeda dari pendapat saya.' },
  { no: 18, dim: 'Keamanan Psikologis', teks: 'Saya menanggapi pengakuan kesalahan dengan mengajak membahas perbaikan tanpa mempermalukan orang yang mengakuinya.' },
  { no: 19, dim: 'Keamanan Psikologis', teks: 'Saya merespons pertanyaan atau permintaan bantuan dengan cara yang membuat orang tersebut tetap nyaman untuk bertanya.' },
  { no: 20, dim: 'Keamanan Psikologis', teks: 'Saya membantu mengembalikan diskusi pada pembahasan gagasan ketika muncul komentar yang merendahkan seseorang.' },
  // Managing ego
  { no: 21, dim: 'Mengelola Ego', teks: 'Saya mengakui keterbatasan pengetahuan saya ketika membahas persoalan di luar keahlian saya.' },
  { no: 22, dim: 'Mengelola Ego', teks: 'Saya bersedia mengubah pendapat ketika terdapat bukti atau alasan yang lebih kuat.' },
  { no: 23, dim: 'Mengelola Ego', teks: 'Saya mengakui kontribusi orang lain ketika menjelaskan keberhasilan bersama.' },
  { no: 24, dim: 'Mengelola Ego', teks: 'Saya berusaha memahami isi kritik yang saya terima sebelum membela pendapat saya.' },
];

const dimensiList = ['Kesadaran Diri', 'Pengelolaan Diri', 'Kepemimpinan Empatik', 'Kesadaran Sosial', 'Keamanan Psikologis', 'Mengelola Ego'];

export default function Modul4BaruPage() {
  const router = useRouter();
  const [name, setName] = useState('Anonim');
  const [group, setGroup] = useState('1');
  const [isHydrated, setIsHydrated] = useState(false);

  // State Form
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [answers, setAnswers] = useState<{ [key: number]: number | 'NA' }>({});
  
  // State Hasil Skor
  const [skorDimensi, setSkorDimensi] = useState<{ [key: string]: { rata: number, valid: number } }>({});
  
  // State Isian Lanjutan
  const [kekuatan, setKekuatan] = useState('');
  const [fokus, setFokus] = useState('');
  const [tindakan, setTindakan] = useState('');
  const [pemicu, setPemicu] = useState('');
  const [strategi, setStrategi] = useState('');
  const [refleksi, setRefleksi] = useState('');

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem('peserta_name') || 'Anonim');
    setGroup(localStorage.getItem('peserta_group') || '1');
    setIsHydrated(true);
  }, []);

  const handleAnswer = (no: number, val: number | 'NA') => {
    setAnswers({ ...answers, [no]: val });
  };

  const hitungSkor = () => {
    const hasil: { [key: string]: { total: number, valid: number } } = {};
    
    dimensiList.forEach(dim => {
      const soalDim = pertanyaan.filter(p => p.dim === dim);
      let total = 0;
      let valid = 0;
      
      soalDim.forEach(soal => {
        const val = answers[soal.no];
        if (typeof val === 'number') {
          total += val;
          valid++;
        }
      });

      // Aturan: Minimal 3 dari 4 dijawab
      if (valid >= 3) {
        hasil[dim] = { rata: total / valid, valid };
      } else {
        hasil[dim] = { rata: 0, valid };
      }
    });
    
    setSkorDimensi(hasil);
    setStep(2);
  };

  const handleGetAI = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wleis-baru',
          skorDimensi,
          kekuatan,
          fokus,
          tindakan,
          pemicu,
          strategi
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
    if (!refleksi.trim()) return alert('Mohon isi refleksi pribadi Anda.');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('individual_submissions').insert({
        module_id: 40, // Pakai ID 40 biar beda sama WLEIS lama (4)
        payload: {
          name,
          group,
          skor_dimensi: skorDimensi,
          jawaban_mentah: answers,
          kekuatan,
          fokus,
          tindakan,
          pemicu,
          strategi
        },
        ai_feedback: aiFeedback,
        reflection: refleksi,
        is_completed: true,
      });
      if (error) throw error;
      alert('Refleksi EI & Profesionalisme berhasil disimpan!');
      router.push('/');
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) return <div className="p-10 text-center">Memuat...</div>;

  return (
    <main className="min-h-[100dvh] bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto bg-white md:my-6 md:rounded-xl md:shadow-md">
        
        {/* Header Sticky */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b md:border-0 md:rounded-t-xl px-4 md:px-8 py-3 md:py-6">
          <button onClick={() => router.push('/')} className="text-blue-600 text-sm hover:underline min-h-[44px]">
            &larr; Kembali ke Dashboard
          </button>
          <h1 className="text-lg md:text-2xl font-bold text-blue-800 mt-1">Refleksi Emotional Intelligence & Profesionalisme</h1>
        </div>

        <div className="px-4 md:px-8 pb-8">
          
          {/* ================= STEP 1: PERTANYAAN ================= */}
          {step === 1 && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-900 border border-blue-200">
                <p className="mb-2">Instrumen ini membantu Anda mengenali kebiasaan dalam memahami dan mengelola emosi, memahami orang lain, membangun suasana kerja yang aman, serta mengelola ego dalam lingkungan akademik.</p>
                <p className="mb-2">Bacalah setiap pernyataan dan pilih jawaban yang paling menggambarkan diri Anda berdasarkan pengalaman selama <b>empat minggu terakhir</b>.</p>
                <p className="mb-2 font-semibold">Skala Jawaban:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>1 = Sangat tidak sesuai dengan diri saya</li>
                  <li>2 = Tidak sesuai dengan diri saya</li>
                  <li>3 = Cukup sesuai dengan diri saya</li>
                  <li>4 = Sesuai dengan diri saya</li>
                  <li>5 = Sangat sesuai dengan diri saya</li>
                  <li>NA = Belum dapat menilai (tidak diberi skor)</li>
                </ul>
                <p className="italic text-xs">Tidak ada jawaban benar atau salah. Hasil digunakan untuk refleksi pribadi.</p>
              </div>

              <div className="space-y-6">
                {pertanyaan.map((q) => (
                  <div key={q.no} className="border-b pb-4">
                    <p className="text-xs font-semibold text-blue-500 mb-1">{q.dim}</p>
                    <p className="text-gray-800 mb-3 font-medium text-sm md:text-base leading-relaxed">{q.no}. {q.teks}</p>
                    
                    <div className="grid grid-cols-6 gap-1 md:gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label key={val} className={`flex flex-col items-center justify-center py-2 md:py-3 rounded-lg cursor-pointer border-2 transition ${answers[q.no] === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                          <input type="radio" name={`q-${q.no}`} checked={answers[q.no] === val} onChange={() => handleAnswer(q.no, val)} className="sr-only" />
                          <span className="font-bold md:text-lg">{val}</span>
                        </label>
                      ))}
                      <label className={`flex flex-col items-center justify-center py-2 md:py-3 rounded-lg cursor-pointer border-2 transition ${answers[q.no] === 'NA' ? 'bg-gray-600 text-white border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-400'}`}>
                        <input type="radio" name={`q-${q.no}`} checked={answers[q.no] === 'NA'} onChange={() => handleAnswer(q.no, 'NA')} className="sr-only" />
                        <span className="font-bold text-xs">NA</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={hitungSkor} className="mt-8 w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition min-h-[48px]">
                Lihat Hasil Refleksi
              </button>
            </>
          )}

          {/* ================= STEP 2: HASIL & ISIAN LANJUTAN ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Hasil Refleksi Anda</h2>
                <div className="space-y-3">
                  {dimensiList.map(dim => {
                    const data = skorDimensi[dim];
                    return (
                      <div key={dim} className="flex justify-between items-center text-sm md:text-base border-b pb-2">
                        <span className="font-medium text-gray-700">{dim}</span>
                        <span className="font-bold text-blue-700">
                          {data.valid >= 3 ? `${data.rata.toFixed(1)}/5` : <span className="text-red-500 text-xs">Jawaban belum cukup</span>}
                          <span className="text-gray-400 text-xs ml-2 font-normal">({data.valid}/4)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">
                  Hasil ini menggambarkan penilaian Anda terhadap kebiasaan sendiri. Pilih satu perilaku yang ingin dipertahankan dan satu perilaku yang ingin dilatih.
                </p>
              </div>

              <h2 className="font-bold text-lg text-gray-800 pt-4">Isian Lanjutan</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">1. Kekuatan Pribadi (Pilih dari 24 pernyataan di atas)</label>
                  <input type="text" value={kekuatan} onChange={(e) => setKekuatan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder="Contoh: Saya bersedia mengubah pendapat..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">2. Fokus Latihan (Pilih dari 24 pernyataan di atas)</label>
                  <input type="text" value={fokus} onChange={(e) => setFokus(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder="Contoh: Saya berusaha memahami isi kritik..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">3. Tindakan Konkret</label>
                  <textarea value={tindakan} onChange={(e) => setTindakan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px]" placeholder="Apa yang akan Anda lakukan agar perilaku tersebut terlihat?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">4. Situasi Pemicu</label>
                  <textarea value={pemicu} onChange={(e) => setPemicu(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px]" placeholder="Situasi apa yang mungkin membuat Anda sulit menjalankan perilaku tersebut?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">5. Strategi Pribadi</label>
                  <textarea value={strategi} onChange={(e) => setStrategi(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[80px]" placeholder="Apa yang akan Anda lakukan jika situasi tersebut muncul?" />
                </div>
              </div>

              <button onClick={handleGetAI} disabled={isSubmitting || !fokus || !tindakan} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {isSubmitting ? 'Meminta Respon AI...' : '✨ Minta Respon AI'}
              </button>

              {aiFeedback && (
                <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-500">
                  <h3 className="font-bold text-green-800 mb-1 text-sm">Respon AI:</h3>
                  <p className="text-gray-700 text-sm italic leading-relaxed">"{aiFeedback}"</p>
                </div>
              )}

              <div className="pt-4 border-t mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Refleksi Pribadi (Untuk RTL Anda)</label>
                <textarea value={refleksi} onChange={(e) => setRefleksi(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Apa yang akan Anda ubah dari cara Anda memimpin setelah materi ini?" />
              </div>

              <button onClick={handleSave} disabled={isSubmitting || !refleksi.trim()} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Semua Hasil'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}