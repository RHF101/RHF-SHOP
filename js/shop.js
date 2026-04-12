/**
 * RHF STORZ - Shop Engine V6 (Complete Build)
 * Optimized for Architect Performance
 */

// --- 1. CONFIG FIREBASE ---
// Pastikan config ini SAMA PERSIS dengan yang ada di admin.html
const firebaseConfig = {
    apiKey: "AIzaSyCVqKwHmRBxWu5hjulwmhradnGbp0yFhbY",
    authDomain: "rhf-shop.firebaseapp.com",
    databaseURL: "https://rhf-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rhf-shop",
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

let allProducts = [];

// --- 2. AUTHENTICATION MONITOR ---
auth.onAuthStateChanged(user => {
    const userDisplay = document.getElementById('user-display');
    if (user) {
        if(userDisplay) userDisplay.innerText = user.displayName || "Arsitek";
        startShopSync();
    } else {
        // Jika tidak login, tendang ke index
        window.location.replace("index.html");
    }
});

// --- 3. DATABASE SYNC (READ PRODUCTS) ---
function startShopSync() {
    console.log("Connecting to Warehouse...");
    
    // Mendengarkan perubahan di tabel 'products'
    db.ref('products').on('value', snap => {
        const data = snap.val();
        allProducts = [];
        
        if (data) {
            // Mengubah Object Firebase menjadi Array agar bisa difilter
            Object.keys(data).forEach(key => {
                allProducts.push({ 
                    id: key, 
                    ...data[key] 
                });
            });
        }
        
        // Urutkan berdasarkan yang terbaru diupload
        allProducts.reverse();
        
        // Tampilkan semua produk saat pertama kali load
        renderProducts(allProducts);
    }, error => {
        console.error("Database Error: ", error);
    });
}

// --- 4. RENDER ENGINE ---
function renderProducts(list) {
    const grid = document.getElementById('main-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: #444;">
                <p>Gudang kosong atau koneksi terputus.</p>
            </div>`;
        return;
    }

    list.forEach(p => {
        // Format deskripsi agar support baris baru (jika ada)
        const displayDesc = p.desc ? p.desc.replace(/\n/g, '<br>') : 'RHF Premium Script';
        
        grid.innerHTML += `
            <div class="product-card">
                <div class="tag tag-${p.label ? p.label.toLowerCase() : 'biasa'}">${p.label || 'BIASA'}</div>
                <div class="img-wrap">
                    <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
                </div>
                <h4 class="p-title">${p.name}</h4>
                <div class="p-desc">${displayDesc}</div>
                <div class="p-price">Rp ${p.price ? p.price.toLocaleString() : '0'}</div>
                <button class="btn-buy" onclick="checkout('${p.id}', '${p.name}', ${p.price})">BELI SEKARANG</button>
            </div>
        `;
    });
}

// --- 5. FILTER SYSTEM ---
window.filterShop = function(label, el) {
    // Update UI tombol (chips)
    const chips = document.querySelectorAll('.chip');
    chips.forEach(c => c.classList.remove('active'));
    if(el) el.classList.add('active');

    if (label === 'All') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.label === label);
        renderProducts(filtered);
    }
};

// --- 6. CHECKOUT LOGIC ---
window.checkout = function(id, name, price) {
    // Generate kode unik (100 - 999)
    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    const totalWithCode = price + uniqueCode;
    
    const confirmMessage = `
--- KONFIRMASI PESANAN ---
Item: ${name}
Total Bayar: Rp ${totalWithCode.toLocaleString()}

(Wajib transfer sesuai nominal sampai 3 angka terakhir agar otomatis terbaca oleh sistem).

Lanjutkan pemesanan?`;

    if (confirm(confirmMessage)) {
        const tid = "RHF" + Date.now().toString().slice(-6);
        const currentUser = auth.currentUser;

        db.ref('transactions/' + tid).set({
            tid: tid,
            userId: currentUser.uid,
            userName: currentUser.displayName || "Unknown User",
            productName: name,
            basePrice: price,
            uniqueCode: uniqueCode,
            total: totalWithCode,
            status: 'Pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("PESANAN BERHASIL!\nSilakan bayar Rp " + totalWithCode.toLocaleString());
            // Opsional: Arahkan ke halaman riwayat atau struk
        }).catch(err => {
            alert("Sistem Error: " + err.message);
        });
    }
};

console.log("RHF Shop Engine V6 Loaded Successfully.");
