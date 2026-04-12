/**
 * RHF STORZ - Backend Auth Verifier
 * Path: /api/auth.js
 */

export default async function handler(req, res) {
  // Menangani CORS agar Frontend bisa mengakses API ini
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { uid, email } = req.body;

  // Proteksi Sederhana: Cek apakah UID dan Email dikirim
  if (!uid || !email) {
    return res.status(400).json({ 
      success: false, 
      message: "Data autentikasi tidak lengkap." 
    });
  }

  try {
    /**
     * Logic Verifikasi:
     * Di sini kamu bisa menambahkan pengecekan apakah email tersebut 
     * terdaftar sebagai admin di database atau environment variable Vercel.
     */
    const adminEmail = process.env.ADMIN_EMAIL; // Ambil dari Environment Variable Vercel

    if (email === adminEmail) {
      return res.status(200).json({
        success: true,
        role: "admin",
        message: "Autentikasi Arsitek Berhasil."
      });
    } else {
      return res.status(200).json({
        success: true,
        role: "user",
        message: "Autentikasi Pembeli Berhasil."
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Sistem Auth Error: " + error.message 
    });
  }
}

