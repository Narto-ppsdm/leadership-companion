import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Gunakan model yang tersedia, misal gemini-1.5-flash atau gemini-2.0-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    let prompt = '';

    if (body.type === 'wleis') {
      prompt = `
        Seorang peserta pelatihan kepemimpinan di Fakultas Kedokteran baru saja menyelesaikan tes Emotional Intelligence (WLEIS).
        Skor total mereka adalah ${body.totalScore} dari maksimal 80.
        Berikan analisis singkat (maksimal 100 kata) dalam Bahasa Indonesia yang santun.
        Jelaskan secara umum apa arti skor tersebut dan berikan 1-2 saran praktis untuk meningkatkan kecerdasan emosional mereka sebagai calon pemimpin.
      `;
    } else if (body.type === 'catatan') {
      prompt = `
        Seorang peserta pelatihan kepemimpinan di Fakultas Kedokteran sedang menulis catatan pembelajaran.
        Modul: "${body.moduleName}"
        Catatan Peserta: "${body.notes}"
        Berikan respon apresiatif dan reflektif (maksimal 100 kata) dalam Bahasa Indonesia.
        Berikan 1 pertanyaan reflektif untuk mempertajam kesadaran mereka.
      `;
    } else if (body.type === 'individu-materi') {
      prompt = `
        Kamu adalah pakar pengembangan kepemimpinan di Fakultas Kedokteran.
        Seorang peserta dari Kelompok ${body.group} sedang mengerjakan proyek "${body.projectName}".
        Fokus pengamatannya adalah: "${body.focus}".
        Temuannya: "${body.temuan}"
        Usulan tindakannya: "${body.usulan}"
        Berikan review singkat (maksimal 120 kata) dalam Bahasa Indonesia yang membangun.
        Apakah temuan dan usulan mereka sudah tepat sasaran dan aplikatif?
      `;
    } else if (body.type === 'strategic-swot') {
      prompt = `
        Kamu adalah pakar tata kelola dan strategi di Fakultas Kedokteran.
        Seorang peserta pelatihan kepemimpinan sedang menganalisis aspek "${body.aspek}".
        Berikut analisis SWOT mereka:
        - Strength: ${body.strength}
        - Weakness: ${body.weakness}
        - Opportunity: ${body.opportunity}
        - Threat: ${body.threat}
        Rencana Aksi 6 bulan mereka:
        "${body.actionPlan}"
        Berikan evaluasi singkat (maksimal 120 kata) dengan bahasa Indonesia yang suportif.
        Fokuskan evaluasi pada: Apakah Rencana Aksi mereka realistis, terukur, dan benar-benar menjawab kelemahan/ancaman yang ada di SWOT mereka?
      `;
    } else if (body.type === 'conflict-management') {
      prompt = `
        Kamu adalah pakar resolusi konflik dan kepemimpinan di Fakultas Kedokteran.
        Seorang peserta pelatihan sedang menganalisis sebuah skenario konflik:
        "${body.kasus}"
        
        Analisis Akar Masalah dari peserta:
        "${body.akarMasalah}"
        
        Langkah Penyelesaian dari peserta:
        "${body.langkahResolusi}"
        
        Berikan review singkat (maksimal 120 kata) dengan bahasa Indonesia yang suportif.
        Fokuskan evaluasi pada: Apakah akar masalah yang dianalisis sudah tepat? Apakah langkah penyelesaiannya realistis dan berpihak pada solusi win-win?
      `;

    } else if (body.type === 'mentoring-grow') {
      prompt = `
        Kamu adalah pakar mentoring dan coaching di Fakultas Kedokteran.
        Seorang peserta pelatihan sedang melakukan coaching kepada dosen muda dengan profil:
        "${body.profilMentee}"
        
        Berikut analisis pendekatan GROW mereka:
        - Goal (Tujuan): ${body.goal}
        - Reality (Realita): ${body.reality}
        - Options (Opsi): ${body.options}
        - Will (Rencana Aksi): ${body.will}
        
        Berikan review singkat (maksimal 120 kata) dengan bahasa Indonesia yang suportif.
        Fokuskan evaluasi pada: Apakah pertanyaan/arahan coaching mereka sudah menggali potensi mentee? Apakah rencana aksinya (Will) realistis dan terukur?
      `;

    } else if (body.type === 'wleis-baru') {
      prompt = `
        Kamu adalah Coach Kepemimpinan Akademik.
        Seorang dosen telah mengisi Refleksi Emotional Intelligence & Profesionalisme.
        
        Berikut skor rata-rata mereka per dimensi (skala 1-5):
        ${JSON.stringify(body.skorDimensi)}
        
        Isian lanjutan mereka:
        - Kekuatan yang dipertahankan: "${body.kekuatan}"
        - Fokus latihan: "${body.fokus}"
        - Tindakan konkret: "${body.tindakan}"
        - Situasi pemicu: "${body.pemicu}"
        - Strategi pribadi: "${body.strategi}"
        
        Tugasmu:
        Berikan review singkat (maksimal 150 kata) dalam bahasa Indonesia yang suportif dan profesional.
        Apresiasi fokus latihan yang mereka pilih. Berikan 1-2 saran praktis agar "Tindakan Konkret" dan "Strategi Pribadi" mereka bisa benar-benar berhasil saat menghadapi "Situasi Pemicu".
      `;

    } else {
      return NextResponse.json({ feedback: 'Tipe permintaan AI tidak dikenali.' }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ feedback: text });

  } catch (error: any) {
    console.error("Error Detail:", error.message);
    return NextResponse.json({ feedback: `ERROR SYSTEM: ${error.message}` }, { status: 500 });
  }
}