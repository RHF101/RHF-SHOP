/**
 * RHF STORZ - Product Engine (Backend)
 * Path: /api/products.js
 */

export default async function handler(req, res) {
  // Pengaturan CORS agar Frontend bisa berkomunikasi dengan API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil URL Database dari Environment Variable Vercel
  // Pastikan kamu sudah menambahkan FIREBASE_DB_URL di Dashboard Vercel
  const DB_URL = process.env.FIREBASE_DB_URL || "https://rhf-shop-default-rtdb.asia-southeast1.firebasedatabase.app";

  try {
    // Mengambil data dari folder 'products' di Firebase
    const response = await fetch(`${DB_URL}/products.json`);
    
    if (!response.ok) {
      throw new Error("Gagal menghubungi Firebase Database");
    }

    const data = await response.json();

    // Jika data kosong, kirim objek kosong agar frontend tidak error
    if (!data) {
      return res.status(200).json({});
    }

    // Kirim data ke frontend
    return res.status(200).json(data);

  } catch (error) {
    console.error("API Products Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Gagal memuat katalog produk.",
      error: error.message 
    });
  }
}

