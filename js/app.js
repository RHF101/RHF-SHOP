/**
 * RHF STORZ - Core Application Logic
 * System Architect: Radit Tiya
 * Version: 2.0 (Vercel API Ready)
 */

// 1. Inisialisasi Firebase (Gunakan Config yang sama)
const firebaseConfig = {
    apiKey: "AIzaSyCVqKwHmRBxWu5hjulwmhradnGbp0yFhbY",
    authDomain: "rhf-shop.firebaseapp.com",
    databaseURL: "https://rhf-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rhf-shop",
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// 2. State Management Global
let currentUser = null;

/**
 * Fungsi Proteksi Halaman
 * Menjaga agar user yang belum login tidak bisa masuk ke shop/admin
 */
function initProtectedRoute() {
    auth.onAuthStateChanged(user => {
        const path = window.location.pathname;

        if (user) {
            currentUser = user;
            // Jika user di halaman login tapi sudah login, lempar ke market
            if (path === "/" || path.includes("index.html")) {
                window.location.replace("/shop.html");
            }
        } else {
            // Jika tidak ada user dan tidak di halaman login, lempar ke login
            if (!path.includes("index.html") && path !== "/") {
                window.location.replace("/index.html");
            }
        }
    });
}

/**
 * Fungsi Logout Global
 */
function logout() {
    if (confirm("Apakah anda yakin ingin keluar dari RHF STORZ?")) {
        auth.signOut().then(() => {
            window.location.replace("/index.html");
        }).catch(err => {
            console.error("Logout Error:", err);
        });
    }
}

/**
 * Fungsi Checkout (Alur Otomatis Gratis)
 * Membuat invoice di database dan memberikan instruksi pembayaran
 */
async function processCheckout(productId, productName, price) {
    if (!currentUser) return alert("Silahkan login terlebih dahulu!");

    // Generate Kode Unik (3 Digit)
    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    const totalPayment = price + uniqueCode;
    const trxId = "TRX-" + Date.now();

    const trxData = {
        trxId: trxId,
        userUid: currentUser.uid,
        userName: currentUser.displayName,
        userEmail: currentUser.email,
        productId: productId,
        productName: productName,
        amount: price,
        uniqueCode: uniqueCode,
        total: totalPayment,
        status: "Pending",
        date: new Date().toLocaleString("id-ID")
    };

    try {
        // Simpan ke database folder 'transactions'
        await db.ref('transactions/' + trxId).set(trxData);
        
        // Tampilkan Modal/Instruksi ke Pembeli
        alert(`
            INVOICE: ${trxId}
            -----------------------------
            Produk: ${productName}
            Total Bayar: Rp ${totalPayment.toLocaleString()}
            
            PENTING: Mohon transfer tepat hingga 3 digit terakhir (Rp ${uniqueCode}) agar sistem bisa memverifikasi otomatis.
            
            Silahkan transfer ke QRIS Admin dan tunggu konfirmasi.
        `);
    } catch (error) {
        console.error("Checkout Fail:", error);
        alert("Gagal memproses pesanan. Coba lagi.");
    }
}

/**
 * Helper: Format Mata Uang
 */
function formatIDR(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

// Jalankan proteksi saat script dimuat
initProtectedRoute();

