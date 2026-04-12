/**
 * RHF STORZ - Shop Engine V5 (Auto-Sync Admin)
 */

const db = firebase.database();
const auth = firebase.auth();

let productsData = [];

// --- 1. SESSION MONITOR ---
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-display').innerText = user.displayName.split(' ')[0];
        loadShopData();
    } else {
        window.location.replace("index.html");
    }
});

// --- 2. LOAD DATA DENGAN FILTER EXPIRED ---
function loadShopData() {
    db.ref('products').on('value', snap => {
        const data = snap.val();
        const now = Date.now();
        
        productsData = [];
        if (data) {
            Object.values(data).forEach(p => {
                // LOGIC: Jangan masukkan ke list jika barang sudah expired
                if (p.expiryAt && now > p.expiryAt) {
                    return; // Lewati produk ini
                }
                productsData.push(p);
            });
        }
        renderShop(productsData);
    });
}

// --- 3. RENDER PRODUK (DENGAN DESKRIPSI) ---
function renderShop(list) {
    const grid = document.getElementById('shop-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    
    if(list.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#555; padding:40px 0;">Belum ada produk atau waktu promo habis.</p>`;
        return;
    }

    list.forEach(p => {
        const tagClass = `tag-${p.label.toLowerCase()}`;
        
        // Format Deskripsi: Mengubah baris baru (\n) menjadi <br>
        const cleanDesc = p.desc ? p.desc.replace(/\n/g, '<br>') : 'Tidak ada deskripsi.';

        grid.innerHTML += `
            <div class="product-card">
                <div class="label-tag ${tagClass}">${p.label}</div>
                <img src="${p.image}" class="img-product" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                
                <h4 class="product-title">${p.name}</h4>
                
                <div class="product-desc" style="font-size: 0.7rem; color: #777; margin-bottom: 10px; height: 45px; overflow-y: auto;">
                    ${cleanDesc}
                </div>

                <p class="product-price">Rp ${p.price.toLocaleString()}</p>
                <button class="btn-buy" onclick="handlePurchase('${p.id}', '${p.name}', ${p.price})">BELI SEKARANG</button>
            </div>
        `;
    });
}

// --- 4. FILTER CATEGORY ---
function filterData(cat, element) {
    const allChips = document.querySelectorAll('.chip');
    allChips.forEach(chip => chip.classList.remove('active'));
    if(element) element.classList.add('active');

    if (cat === 'All') {
        renderShop(productsData);
    } else {
        const filtered = productsData.filter(p => p.label === cat);
        renderShop(filtered);
    }
}

// --- 5. LOGIC PEMBELIAN ---
function handlePurchase(id, name, price) {
    const user = auth.currentUser;
    if(!user) return;

    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    const totalPay = price + uniqueCode;
    const trxId = "RHF-" + Date.now().toString().slice(-5);

    const confirmBuy = confirm(`[STRUK PESANAN]\nItem: ${name}\nTotal: Rp ${totalPay.toLocaleString()}\n\nLanjutkan pemesanan?`);

    if (confirmBuy) {
        db.ref('transactions/' + trxId).set({
            userUid: user.uid,
            userName: user.displayName,
            productName: name,
            total: totalPay,
            uniqueCode: uniqueCode,
            status: 'Pending',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Pesanan terkirim! Cek struk di bagian atas halaman.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
