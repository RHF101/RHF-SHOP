/**
 * RHF STORZ - Shop Engine V9 (Anti-Collision System)
 * Build Date: 2026-04-13
 */

// --- 1. CONFIG FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCVqKwHmRBxWu5hjulwmhradnGbp0yFhbY",
    authDomain: "rhf-shop.firebaseapp.com",
    databaseURL: "https://rhf-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rhf-shop",
};

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
        window.location.replace("index.html");
    }
});

// --- 3. DATABASE SYNC ---
function startShopSync() {
    db.ref('products').on('value', snap => {
        const data = snap.val();
        allProducts = [];
        if (data) {
            Object.keys(data).forEach(key => {
                allProducts.push({ id: key, ...data[key] });
            });
        }
        allProducts.reverse();
        renderProducts(allProducts);
    });
}

// --- 4. RENDER ENGINE ---
function renderProducts(list) {
    const grid = document.getElementById('main-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px 0; color: #444;"><p>Gudang Kosong.</p></div>`;
        return;
    }

    list.forEach(p => {
        const displayDesc = p.desc ? p.desc.replace(/\n/g, '<br>') : 'RHF Premium Asset';
        grid.innerHTML += `
            <div class="product-card">
                <div class="tag tag-${p.label ? p.label.toLowerCase() : 'biasa'}">${p.label || 'BIASA'}</div>
                <div class="img-wrap">
                    <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
                </div>
                <h4 class="p-title">${p.name}</h4>
                <div class="p-desc">${displayDesc}</div>
                <div class="p-price">Rp ${p.price ? p.price.toLocaleString() : '0'}</div>
                <div style="font-size: 0.6rem; color: #555; margin-bottom: 10px;">Stok Tersedia: ${p.stock || 0}</div>
                <button class="btn-buy" onclick="checkout('${p.id}', '${p.name}', ${p.price})">BELI SEKARANG</button>
            </div>
        `;
    });
}

// --- 5. LOGIKA KODE UNIK (ANTI-TABRAKAN) ---
async function generateSecureTotal(basePrice) {
    let isFound = false;
    let finalTotal = 0;
    let selectedCode = 0;

    // Loop sampai ketemu nominal yang tidak sedang dipesan orang lain (Pending)
    while (!isFound) {
        let code = Math.floor(Math.random() * 9000) + 1000; // 1000 - 9999
        let candidateTotal = basePrice + code;

        const snapshot = await db.ref('transactions')
            .orderByChild('total')
            .equalTo(candidateTotal)
            .once('value');

        let isInUse = false;
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.val().status === 'Pending') isInUse = true;
            });
        }

        if (!isInUse) {
            finalTotal = candidateTotal;
            selectedCode = code;
            isFound = true;
        }
    }
    return { finalTotal, selectedCode };
}

// --- 6. CHECKOUT LOGIC V9 ---
window.checkout = async function(id, name, price) {
    // Tampilkan loading saat AI mencari kode unik yang aman
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "MENGHITUNG KODE UNIK...";
    btn.disabled = true;

    try {
        const { finalTotal, selectedCode } = await generateSecureTotal(price);
        
        const confirmMessage = `
--- RHF STORZ INVOICE ---
Item: ${name}
Harga Asli: Rp ${price.toLocaleString()}
Kode Unik: +${selectedCode}

TOTAL TRANSFER: Rp ${finalTotal.toLocaleString()}

*Wajib transfer PAS sesuai nominal agar terbaca otomatis. Lanjutkan?`;

        if (confirm(confirmMessage)) {
            const tid = "RHF" + Date.now().toString().slice(-6);
            const currentUser = auth.currentUser;

            await db.ref('transactions/' + tid).set({
                tid: tid,
                userId: currentUser.uid,
                userName: currentUser.displayName || "Arsitek Member",
                productName: name,
                basePrice: price,
                uniqueCode: selectedCode,
                total: finalTotal,
                status: 'Pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            alert("PESANAN BERHASIL!\nSilakan transfer Rp " + finalTotal.toLocaleString() + "\n\nSistem akan otomatis memindahkan halaman jika sudah terverifikasi.");

            // --- AUTO-WATCHER (Menunggu Admin Verifikasi) ---
            db.ref('transactions/' + tid + '/status').on('value', snap => {
                if (snap.val() === 'Success') {
                    window.location.href = "nota.html?tid=" + tid;
                }
            });

        }
    } catch (err) {
        alert("Gagal memproses pesanan: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

console.log("RHF Shop V9: Anti-Collision & Secure Code Active.");
    
