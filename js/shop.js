/**
 * RHF STORZ - Core Shop Logic (Enhanced Version)
 * Built by Architect for high-performance mobile systems.
 */

const db = firebase.database();
const auth = firebase.auth();
const ARSITEK_UID = "8VjkMJXIABd51kcCRlx8eqhZMZy2";

let productsData = [];

// --- 1. SESSION & AUTH MONITOR ---
auth.onAuthStateChanged(user => {
    if (user) {
        // Tampilkan nama depan user
        document.getElementById('user-display').innerText = user.displayName.split(' ')[0];
        
        // Cek jika yang login adalah Arsitek
        if (user.uid === ARSITEK_UID) {
            const gate = document.getElementById('admin-gate');
            if(gate) {
                gate.innerHTML = `
                    <a href="control-center-8VjkMJXIABd51kcCRlx8eqhZMZy2-x99.html" 
                       style="position:fixed; bottom:20px; right:20px; background:var(--gold); color:#000; padding:12px 22px; border-radius:50px; text-decoration:none; font-weight:bold; z-index:9999; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                       ⚙️ ADMIN PANEL
                    </a>
                `;
            }
        }
        
        // Jalankan sistem pelacakan dan load produk
        checkMyOrder(user.uid);
        loadShopData();
    } else {
        // Jika tidak ada session, tendang ke landing page
        window.location.replace("index.html");
    }
});

// --- 2. DATABASE: LOAD PRODUCTS ---
function loadShopData() {
    db.ref('products').on('value', snap => {
        const data = snap.val();
        // Simpan ke variabel global untuk difilter nanti
        productsData = data ? Object.values(data) : [];
        renderShop(productsData);
    });
}

// --- 3. UI: RENDER PRODUCT CARDS ---
function renderShop(list) {
    const grid = document.getElementById('shop-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    
    if(list.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#555; padding:40px 0;">Produk tidak ditemukan di kategori ini.</p>`;
        return;
    }

    list.forEach(p => {
        const tagClass = `tag-${p.label.toLowerCase()}`;
        grid.innerHTML += `
            <div class="product-card">
                <div class="label-tag ${tagClass}">${p.label}</div>
                <img src="${p.image}" style="width:100%; border-radius:8px; height:130px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                <h4 style="margin:12px 0 5px; font-size:0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</h4>
                <p style="color:var(--gold); font-weight:bold; margin:0; font-size:0.95rem;">Rp ${p.price.toLocaleString()}</p>
                <button class="btn-buy" onclick="handlePurchase('${p.id}', '${p.name}', ${p.price})">BELI SEKARANG</button>
            </div>
        `;
    });
}

// --- 4. LOGIC: FILTER CATEGORY (WITH COLOR CHANGE) ---
function filterData(cat, element) {
    // RESET: Hapus warna kuning dari semua tombol filter
    const allChips = document.querySelectorAll('.chip');
    allChips.forEach(chip => chip.classList.remove('active'));

    // SET: Tambahkan warna kuning ke tombol yang diklik
    if(element) {
        element.classList.add('active');
    }

    // FILTER: Tampilkan data sesuai label
    if (cat === 'All') {
        renderShop(productsData);
    } else {
        const filtered = productsData.filter(p => p.label === cat);
        renderShop(filtered);
    }
}

// --- 5. LOGIC: PURCHASE WITH UNIQUE CODE ---
function handlePurchase(id, name, price) {
    const user = auth.currentUser;
    if(!user) return;

    // Generate 3 digit kode unik (misal: 432)
    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    const totalPay = price + uniqueCode;
    
    // Generate ID Transaksi singkat (misal: RHF-12345)
    const trxId = "RHF-" + Date.now().toString().slice(-5);

    const confirmBuy = confirm(`[STRUK PESANAN]\nItem: ${name}\nTotal: Rp ${totalPay.toLocaleString()}\n(Termasuk kode unik: ${uniqueCode})\n\nKlik OK untuk memesan dan dapatkan struk.`);

    if (confirmBuy) {
        db.ref('transactions/' + trxId).set({
            userUid: user.uid,
            userName: user.displayName,
            productName: name,
            basePrice: price,
            uniqueCode: uniqueCode,
            total: totalPay,
            status: 'Pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Berhasil! Silakan transfer sesuai nominal struk.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }).catch(err => {
            alert("Error: " + err.message);
        });
    }
}

// --- 6. SYSTEM: REAL-TIME ORDER TRACKING ---
function checkMyOrder(uid) {
    db.ref('transactions').orderByChild('userUid').equalTo(uid).limitToLast(1).on('value', snap => {
        const container = document.getElementById('tracking-container');
        if (snap.exists()) {
            container.style.display = 'block';
            const trxId = Object.keys(snap.val())[0];
            const data = snap.val()[trxId];
            
            // Render Struk Digital
            const receipt = document.getElementById('receipt-content');
            if(receipt) {
                receipt.innerHTML = `
                    ID ORDER : ${trxId}<br>
                    ITEM     : ${data.productName}<br>
                    HARGA    : Rp ${data.basePrice.toLocaleString()}<br>
                    UNIQUE   : <span style="color:var(--gold)">${data.uniqueCode}</span><br>
                    ----------------------------<br>
                    TOTAL    : <strong style="color:var(--gold); font-size:1.1rem;">Rp ${data.total.toLocaleString()}</strong>
                `;
            }

            // Update Progress Steps (Tahap 1, 2, 3)
            const s1 = document.getElementById('s1'), 
                  s2 = document.getElementById('s2'), 
                  s3 = document.getElementById('s3');
            const msg = document.getElementById('track-msg');
            
            if(s1 && s2 && s3) {
                [s1, s2, s3].forEach(s => s.classList.remove('active'));

                s1.classList.add('active'); // Tahap 1: Pending
                msg.innerText = "Sistem menunggu pembayaran Anda.";

                if (data.status === 'Process' || data.status === 'Success') {
                    s2.classList.add('active'); // Tahap 2: Diproses Admin
                    msg.innerText = "Dana diterima. Menyiapkan script...";
                }
                if (data.status === 'Success') {
                    s3.classList.add('active'); // Tahap 3: Selesai
                    msg.innerText = "Pesanan telah dikirim ke Email/Chat.";
                }
            }
        } else {
            if(container) container.style.display = 'none';
        }
    });
}
