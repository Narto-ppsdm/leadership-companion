'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { error } from 'console';

const wleisQuestions = [
  "Saya biasanya tahu persis mengapa saya merasakan emosi tertentu saat menghadapi tekanan kerja di fakultas.",
  "Saya memiliki pemahaman yang baik tentang emosi yang saya rasakan sebagai seorang pendidik dan pemimpin.",
  "Saya mampu mengenali perubahan emosi saya sendiri sebelum hal itu memengaruhi keputusan akademik yang saya ambil.",
  "Saya menyadari dampak suasana hati saya terhadap cara saya berinteraksi dengan dosen, mahasiswa, dan staf.",
  "Saya peka terhadap perasaan dosen muda atau mahasiswa meskipun mereka tidak mengungkapkannya secara langsung.",
  "Saya adalah pengamat yang baik dalam membaca emosi orang lain di lingkungan kerja.",
  "Saya dapat memahami emosi rekan kerja atau atasan dari perilaku dan ekspresi mereka.",
  "Saya mampu melihat situasi dari sudut pandang orang lain ketika terjadi perbedaan pendapat.",
  "Saya selalu mendorong diri saya untuk berusaha sebaik mungkin dalam menjalankan tugas kepemimpinan.",
  "Saya mampu mengarahkan emosi saya untuk tetap fokus pada tujuan strategis fakultas.",
  "Saya menggunakan energi emosional positif untuk memotivasi tim dan kolega.",
  "Saya dapat menenangkan diri dengan cepat setelah menghadapi situasi yang menegangkan.",
  "Saya mampu mengendalikan emosi dan menangani kesulitan dengan tenang.",
  "Saya bisa mengatasi perasaan saya ketika sedang marah atau kecewa.",
  "Saya mampu menahan diri untuk tidak bereaksi berlebihan terhadap kritik atau konflik.",
  "Saya secara sadar mengelola emosi saya agar tidak memengaruhi keputusan strategis di departemen/prodi."
];

const semuaModul = [
  { id: 1, title: "Paradigma Baru Kepemimpinan Akademik", desc: "Tantangan FK masa depan.", isCak: false },
  { id: 2, title: "Kepemimpinan Transformasional", desc: "Dari managing people ke developing people.", isCak: false },
  { id: 3, title: "Leadership Communication", desc: "Komunikasi krisis, active listening, dan feedback.", isCak: true },
  { id: 4, title: "Emotional Intelligence (WLEIS)", desc: "Asesmen kecerdasan emosional dan profesionalisme.", isCak: true },
  { id: 5, title: "Ethical Leadership", desc: "Physician leadership dan integritas akademik.", isCak: false },
  { id: 6, title: "Strategic Leadership & Tata Kelola", desc: "Perencanaan strategis dan tata kelola fakultas.", isCak: true },
  { id: 7, title: "Conflict Management", desc: "Resolusi konflik klinik dan preklinik.", isCak: true },
  { id: 8, title: "Mentoring & Coaching", desc: "Pendampingan dosen muda dan model GROW.", isCak: true },
  { id: 9, title: "Leading Change", desc: "Menghadapi resistensi dan menjadi change agent.", isCak: false },
  { id: 10, title: "Becoming Future Leaders", desc: "Refleksi kepemimpinan pribadi.", isCak: false },
];

type View = 'landing' | 'login' | 'dashboard' | 'form-wleis' | 'catatan-materi';

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('1');
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedName, setSavedName] = useState('');

  // State WLEIS (Modul 4)
  const [answers, setAnswers] = useState<number[]>(Array(16).fill(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wleisStep, setWleisStep] = useState<1 | 2 | 3>(1);
  const [totalScore, setTotalScore] = useState(0);
  const [wleisAiFeedbackScore, setWleisAiFeedbackScore] = useState('');
  const [wleisNotes, setWleisNotes] = useState('');
  const [wleisAiFeedbackNotes, setWleisAiFeedbackNotes] = useState('');
  const [wleisReflection, setWleisReflection] = useState('');

  // State Catatan Pribadi (Modul Lain)
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [otherNotes, setOtherNotes] = useState('');
  const [otherReflection, setOtherReflection] = useState('');
  const [otherAiFeedback, setOtherAiFeedback] = useState<string | null>(null);

  // Hydrate dari localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('peserta_name') || '';
    const savedGroup = localStorage.getItem('peserta_group') || '1';
    setName(savedName);
    setGroup(savedGroup);
    setSavedName(savedName); // <-- TAMBAHKAN BARIS INI
    setIsHydrated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Mohon isi nama Anda.');
    localStorage.setItem('peserta_name', name);
    localStorage.setItem('peserta_group', group);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('peserta_name');
    localStorage.removeItem('peserta_group');
    setName('');
    setGroup('1');
    setView('landing');
  };

  // --- Handler WLEIS ---
  const handleOptionChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calculateScore = () => answers.reduce((acc, curr) => acc + curr, 0);

  const handleSubmitWLEIS = async () => {
    if (answers.includes(0)) return alert('Mohon isi semua pertanyaan.');
    setIsSubmitting(true);
    const score = calculateScore();
    setTotalScore(score);

    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wleis', totalScore: score }),
      });
      const data = await response.json();
      setWleisAiFeedbackScore(data.feedback);
      setWleisStep(2);
    } catch {
      alert('Terjadi kesalahan saat menghubungi AI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateWleisNotesAI = async () => {
    if (!wleisNotes.trim()) return alert('Mohon isi hasil pembelajaran Anda.');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'catatan',
          moduleName: 'Emotional Intelligence (WLEIS)',
          notes: wleisNotes,
          context: `Skor WLEIS saya: ${totalScore}/80. ` + wleisAiFeedbackScore
        }),
      });
      const data = await response.json();
      setWleisAiFeedbackNotes(data.feedback);
    } catch {
      alert('Terjadi kesalahan saat meminta respon AI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWLEISAll = async () => {
    if (!wleisReflection.trim()) return alert('Mohon isi refleksi pribadi Anda.');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('individual_submissions').insert({
        module_id: 4,
        payload: { 
          name, group, answers, 
          learning_notes: wleisNotes, 
          reflection: wleisReflection 
        },
        total_score: totalScore,
        ai_feedback: wleisAiFeedbackScore,
        ai_notes_feedback: wleisAiFeedbackNotes,
        is_completed: true,
      });
      if (error) throw error;
      
      alert('Hasil WLEIS, Pembelajaran, dan Refleksi berhasil disimpan!');
      // Reset state WLEIS
      setWleisStep(1);
      setAnswers(Array(16).fill(0));
      setWleisNotes('');
      setWleisReflection('');
      setWleisAiFeedbackScore('');
      setWleisAiFeedbackNotes('');
      setView('dashboard');
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handler Catatan Pribadi ---
  const handleGenerateOtherAI = async () => {
    if (!otherNotes.trim()) return alert('Mohon isi catatan pembelajaran Anda terlebih dahulu.');
    setIsSubmitting(true);
    const currentModule = semuaModul.find((m) => m.id === activeModule);
    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'catatan', moduleName: currentModule?.title, notes: otherNotes }),
      });
      const data = await response.json();
      setOtherAiFeedback(data.feedback);
    } catch {
      alert('Terjadi kesalahan saat meminta respon AI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOtherNotes = async () => {
    if (!otherNotes.trim() || !otherReflection.trim()) return alert('Mohon isi catatan dan refleksi.');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('other_module_notes').insert({
        user_id: name,
        group: group, // <-- TAMBAHKAN BARIS INI
        module_id: activeModule,
        learning_notes: otherNotes,
        ai_feedback: otherAiFeedback,
        reflection: otherReflection,
      });
      if (error) throw error;
      alert('Catatan & Refleksi berhasil disimpan!');
      setOtherNotes('');
      setOtherReflection('');
      setOtherAiFeedback(null);
      setView('dashboard');
    } catch (error: any) {
      alert('Gagal menyimpan catatan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ================= 1. LANDING PAGE =================
  if (view === 'landing') {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center mb-8 max-w-2xl flex flex-col items-center">
          <img src="/logo-upnvj.png" alt="Logo UPNVJ" className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6 drop-shadow-md" />
          <h1 className="text-3xl md:text-5xl font-extrabold text-blue-800 mb-4 tracking-tight text-center">Leadership Companion</h1>
          <p className="text-base md:text-lg text-gray-600 text-center">
            Aplikasi Pendamping Latihan Dasar Kepemimpinan (LDK)
            <br />
            Fakultas Kedokteran UPN "Veteran" Jakarta
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-3xl justify-center">
          <button onClick={() => setView('login')} className="group flex flex-col items-center bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:border-blue-500 border-2 border-transparent w-full md:w-1/2 text-left transition active:scale-[0.98]">
            <div className="text-5xl mb-4 group-hover:scale-110 transition">👨‍⚕️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Masuk sebagai Peserta</h2>
            <p className="text-sm text-gray-500">Isi form, kerjakan proyek kelompok, dan susun RTL Anda.</p>
          </button>
          <Link href="/dashboard-fasilitator" className="group flex flex-col items-center bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:border-green-500 border-2 border-transparent w-full md:w-1/2 text-left transition active:scale-[0.98]">
            <div className="text-5xl mb-4 group-hover:scale-110 transition">🧑‍🏫</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Masuk sebagai Fasilitator</h2>
            <p className="text-sm text-gray-500">Pantau progres dan generate Master Blueprint.</p>
          </Link>
        </div>
      </main>
    );
  }

  // ================= 2. LOGIN PESERTA =================
    // ================= 2. LOGIN PESERTA =================
  if (view === 'login') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-blue-800 mb-6 text-center">Masuk sebagai Peserta</h1>
          
          {savedName ? (
            /* TAMPILAN JIKA PESERTA SUDAH PERNAH LOGIN */
            <div className="space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                <p className="text-sm text-blue-800 mb-1">Selamat datang kembali,</p>
                <p className="text-xl font-bold text-blue-900">{savedName}</p>
                <p className="text-sm text-gray-600 mt-1">Kelompok {group}</p>
              </div>
              <button 
                onClick={() => setView('dashboard')} 
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition min-h-[48px]"
              >
                Lanjutkan Sesi
              </button>
              <button 
                onClick={() => {
                  setSavedName('');
                  setName('');
                }} 
                className="w-full text-gray-500 text-sm hover:underline"
              >
                Masuk dengan Nama Lain (Log Out)
              </button>
            </div>
          ) : (
            /* TAMPILAN JIKA PESERTA BARU PERTAMA KALI LOGIN */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Contoh: dr. Andi" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[44px]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Kelompok</label>
                <select 
                  value={group} 
                  onChange={(e) => setGroup(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[44px] bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>Kelompok {g}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition min-h-[48px]"
              >
                Mulai Sesi
              </button>
              <button 
                type="button" 
                onClick={() => setView('landing')} 
                className="w-full text-gray-500 text-sm hover:underline"
              >
                Kembali
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // ================= 3. DASHBOARD PESERTA =================
  if (view === 'dashboard') {
    return <DashboardView name={name} group={group} onLogout={handleLogout} setView={setView} setActiveModule={setActiveModule} />;
  }

  // ================= 3.5. CATATAN MATERI =================
  if (view === 'catatan-materi' && activeModule) {
    const currentModule = semuaModul.find((m) => m.id === activeModule);
    return (
      <main className="min-h-[100dvh] bg-gray-50 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto bg-white md:my-6 md:rounded-xl md:shadow-md">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b md:border-0 md:rounded-t-xl px-4 md:px-8 py-3 md:py-6">
            <button onClick={() => setView('dashboard')} className="text-blue-600 text-sm hover:underline flex items-center gap-1 min-h-[44px]">&larr; Kembali ke Dashboard</button>
            <h1 className="text-lg md:text-2xl font-bold text-blue-800 mt-1">Modul {currentModule?.id}: {currentModule?.title}</h1>
          </div>
          <div className="px-4 md:px-8 pb-6">
            <p className="text-gray-600 mb-6 text-sm md:text-base">Tuliskan hasil pembelajaran Anda dari sesi ini.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1. Apa hal terpenting yang Anda pelajari?</label>
                <textarea value={otherNotes} onChange={(e) => setOtherNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[140px] resize-y" placeholder="Tuliskan insight Anda di sini..." />
              </div>
              <button onClick={handleGenerateOtherAI} disabled={isSubmitting || !otherNotes.trim()} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px]">
                {isSubmitting ? 'Meminta Respon AI...' : '✨ Minta Respon AI'}
              </button>
              {otherAiFeedback && (
                <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                  <p className="text-gray-700 italic text-sm leading-relaxed">"{otherAiFeedback}"</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2. Refleksi Pribadi (Untuk RTL Anda)</label>
                <textarea value={otherReflection} onChange={(e) => setOtherReflection(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[140px] resize-y" placeholder="Apa yang akan Anda ubah dari cara Anda memimpin setelah materi ini?" />
              </div>
            </div>
          </div>
          <div className="fixed md:static bottom-0 left-0 right-0 md:px-8 md:pb-8 bg-white md:bg-transparent border-t md:border-0 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:shadow-none">
            <button onClick={handleSaveOtherNotes} disabled={isSubmitting || !otherReflection.trim()} className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px]">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan & Refleksi'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ================= 5. FORM WLEIS (STEP 1, 2, 3) =================
  return (
    <main className="min-h-[100dvh] bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto bg-white md:my-6 md:rounded-xl md:shadow-md">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b md:border-0 md:rounded-t-xl px-4 md:px-8 py-3 md:py-6">
          <button onClick={() => setView('dashboard')} className="text-blue-600 text-sm hover:underline min-h-[44px]">&larr; Kembali ke Dashboard</button>
          <h1 className="text-lg md:text-2xl font-bold text-blue-800 mt-1">Modul 4: Emotional Intelligence</h1>
        </div>

        <div className="px-4 md:px-8 pb-6">
          {/* ================= STEP 1: PERTANYAAN ================= */}
          {wleisStep === 1 && (
            <>
              <p className="text-gray-600 mb-6 text-sm md:text-base">Peserta: {name} | Kelompok: {group}</p>
              <div className="space-y-5">
                {wleisQuestions.map((q, index) => (
                  <div key={index} className="border-b pb-4">
                    <p className="text-gray-800 mb-3 font-medium text-sm md:text-base leading-relaxed">{index + 1}. {q}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <label key={val} className={`flex flex-col items-center justify-center py-3 rounded-lg cursor-pointer border-2 transition ${answers[index] === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                          <input type="radio" name={`q-${index}`} value={val} checked={answers[index] === val} onChange={() => handleOptionChange(index, val)} className="sr-only" />
                          <span className="font-bold text-lg">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button onClick={handleSubmitWLEIS} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold min-h-[48px]">
                  {isSubmitting ? 'Memproses...' : 'Lihat Hasil Skor'}
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 2: HASIL SKOR & AI ================= */}
          {wleisStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center py-6">
                <h2 className="text-xl font-bold text-blue-800 mb-2">Hasil Assessment EQ Anda</h2>
                <div className="text-4xl font-extrabold text-blue-600 mb-2">{totalScore} <span className="text-xl text-gray-400">/ 80</span></div>
              </div>
              <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                <h3 className="font-bold text-blue-800 mb-1 text-sm">Review AI (Berdasarkan Skor):</h3>
                <p className="text-gray-700 italic text-sm leading-relaxed">"{wleisAiFeedbackScore}"</p>
              </div>
              <button onClick={() => setWleisStep(3)} className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 transition font-bold min-h-[48px]">
                Lanjut ke Refleksi & Pembelajaran &rarr;
              </button>
            </div>
          )}

          {/* ================= STEP 3: PEMBELAJARAN & REFLEKSI ================= */}
          {wleisStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1. Apa hal terpenting yang Anda pelajari dari hasil skor WLEIS ini?</label>
                <textarea value={wleisNotes} onChange={(e) => setWleisNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Tuliskan insight Anda..." />
              </div>

              <button onClick={handleGenerateWleisNotesAI} disabled={isSubmitting || !wleisNotes.trim()} className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 min-h-[48px]">
                {isSubmitting ? 'Meminta Respon AI...' : '✨ Minta Respon AI'}
              </button>

              {wleisAiFeedbackNotes && (
                <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-500">
                  <h3 className="font-bold text-green-800 mb-1 text-sm">Respon AI (Atas Pembelajaran Anda):</h3>
                  <p className="text-gray-700 italic text-sm leading-relaxed">"{wleisAiFeedbackNotes}"</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2. Refleksi Pribadi (Untuk RTL Anda)</label>
                <textarea value={wleisReflection} onChange={(e) => setWleisReflection(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base text-black min-h-[120px] resize-y" placeholder="Apa yang akan Anda ubah dari cara Anda memimpin?" />
              </div>

              <div className="pt-4 border-t">
                <button onClick={handleSaveWLEISAll} disabled={isSubmitting || !wleisReflection.trim()} className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold min-h-[48px]">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Semua Hasil'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ================= KOMPONEN DASHBOARD =================
function DashboardView({
  name,
  group,
  onLogout,
  setView,
  setActiveModule,
}: {
  name: string;
  group: string;
  onLogout: () => void;
  setView: (v: View) => void;
  setActiveModule: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    setActiveIndex(Math.round(scrollLeft / offsetWidth));
  };

  const scrollToIndex = (i: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: i * scrollRef.current.offsetWidth, behavior: 'smooth' });
  };

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white p-4 md:p-6 border-b shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-blue-800">Selamat Datang, {name}!</h1>
            <p className="text-xs md:text-sm text-gray-500">Anda tergabung di Kelompok {group}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/kelompok" className="bg-green-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
              👥 Ruang Kelompok
            </Link>
            <button onClick={onLogout} className="text-red-500 text-sm hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6">
        {/* DESKTOP GRID */}
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Materi Pelatihan (10 Modul)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {semuaModul.map((modul) => (
              <ModuleCard key={modul.id} modul={modul} setView={setView} setActiveModule={setActiveModule} />
            ))}
          </div>
        </div>

        {/* MOBILE CAROUSEL */}
        <div className="block md:hidden">
          <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" style={{ height: 'calc(100dvh - 180px)' }}>
            {semuaModul.map((modul) => (
              <div key={modul.id} className="w-full flex-shrink-0 snap-center px-2 py-4 flex items-center">
                <ModuleCard modul={modul} setView={setView} setActiveModule={setActiveModule} isMobile />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 pb-4">
            <button onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0} className="w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center disabled:opacity-30">&larr;</button>
            <div className="flex gap-1.5">
              {semuaModul.map((_, i) => (
                <button key={i} onClick={() => scrollToIndex(i)} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'}`} aria-label={`Modul ${i + 1}`} />
              ))}
            </div>
            <button onClick={() => scrollToIndex(Math.min(semuaModul.length - 1, activeIndex + 1))} disabled={activeIndex === semuaModul.length - 1} className="w-10 h-10 rounded-full bg-white shadow border flex items-center justify-center disabled:opacity-30">&rarr;</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ModuleCard({ modul, setView, setActiveModule, isMobile = false }: { modul: (typeof semuaModul)[number]; setView: (v: View) => void; setActiveModule: (id: number) => void; isMobile?: boolean; }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 w-full flex flex-col ${modul.isCak ? 'border-blue-500' : 'border-gray-300'} ${isMobile ? 'p-6 shadow-lg min-h-[70%]' : 'p-5'}`}>
      <div className="flex-1">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Modul {modul.id}</span>
        <h3 className={`font-bold text-gray-800 mt-1 mb-2 leading-tight ${isMobile ? 'text-2xl' : 'text-lg'}`}>{modul.title}</h3>
        <p className={`text-gray-500 ${isMobile ? 'text-base mb-8' : 'text-sm mb-4'}`}>{modul.desc}</p>
      </div>
      
      <div>
        {modul.isCak ? (
          <>
            {modul.id === 4 && (
              <Link href="/modul-4-baru" className={`block text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>
                Masuk ke Sesi
              </Link>
            )}
            {modul.id === 3 && (
              <Link href="/modul-3" className={`block text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>Masuk ke Sesi</Link>
            )}
            {modul.id === 6 && (
              <Link href="/modul-6" className={`block text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>Masuk ke Sesi</Link>
            )}
            {modul.id === 7 && (
              <Link href="/modul-7" className={`block text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>Masuk ke Sesi</Link>
            )}
            {modul.id === 8 && (
              <Link href="/modul-8" className={`block text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>Masuk ke Sesi</Link>
            )}
            
            {/* Modul 9 & 10 sementara "Segera Hadir" dll */}
            {/* Modul 9 & 10 sementara "Segera Hadir" dll */}
            {modul.id !== 3 && modul.id !== 4 && modul.id !== 6 && modul.id !== 7 && modul.id !== 8 && (
              <button disabled className={`w-full bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed ${isMobile ? 'py-4 text-base' : 'py-2 text-sm'}`}>Segera Hadir</button>
            )}
          </>
        ) : (
          <button onClick={() => { setActiveModule(modul.id); setView('catatan-materi'); }} className={`w-full bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 active:scale-[0.98] transition ${isMobile ? 'py-4 text-lg' : 'py-2 text-sm'}`}>Catatan Pribadi</button>
        )}
      </div>
    </div>
  );
}