const db = firebase.database();
const auth = firebase.auth();
const ARSITEK_UID = "8VjkMJXIABd51kcCRlx8eqhZMZy2";

let productsData = [];

// 1. CEK AUTH & TRACKING
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('user-display').innerText = user.displayName.split(' ')[0];
        if (user.uid === ARSITEK_UID) {
            document.getElementById('admin-gate').innerHTML = `
                <a href="control-center-8VjkMJXIABd51kcCRlx8eqhZMZy2-x99.html" style="position:fixed; bottom:20px; right:20px; background:var(--gold); color:#000; padding:12px 20px; border-radius:50px; text-decoration:none; font-weight:bold; z-index:9999;">⚙️ PANEL ADMIN</a>
            `;
        }
        checkMyOrder(user.uid);
        loadShopData();
    } else {
        window.location.replace("index.html");
    }
});

// 2. LOAD DATA PRODUK
function loadShopData() {
    db.ref('products').on('value', snap => {
        const data = snap.val();
        productsData = data ? Object.values(data) : [];
        renderShop(productsData);
    });
}

function renderShop(list) {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    list.forEach(p => {
        const tagClass = `tag-${p.label.toLowerCase()}`;
        grid.innerHTML += `
            <div class="product-card">
                <div class="label-tag ${tagClass}">${p.label}</div>
                <img src="${p.image}" style="width:100%; border-radius:8px; height:120px; object-fit:cover;">
                <h4 style="margin:10px 0 5px; font-size:0.85rem;">${p.name}</h4>
                <p style="color:var(--gold); font-weight:bold; margin:0; font-size:0.9rem;">Rp ${p.price.toLocaleString()}</p>
                <button class="btn-buy" onclick="handlePurchase('${p.id}', '${p.name}', ${p.price})">BELI</button>
            </div>
        `;
    });
}

// 3. LOGIKA BELI DENGAN KODE UNIK
function handlePurchase(id, name, price) {
    const user = auth.currentUser;
    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    const totalPay = price + uniqueCode;
    const trxId = "RHF-" + Date.now().toString().slice(-6);

    const confirmBuy = confirm(`Konfirmasi Pesanan:\n${name}\nTotal: Rp ${totalPay.toLocaleString()}\n(Termasuk kode unik: ${uniqueCode})\n\nLanjutkan?`);

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
            alert("Pesanan Berhasil! Silakan cek struk di bagian atas.");
        });
    }
}

// 4. SISTEM LACAK & STRUK
function checkMyOrder(uid) {
    db.ref('transactions').orderByChild('userUid').equalTo(uid).limitToLast(1).on('value', snap => {
        const container = document.getElementById('tracking-container');
        if (snap.exists()) {
            container.style.display = 'block';
            const trxId = Object.keys(snap.val())[0];
            const data = snap.val()[trxId];
            
            document.getElementById('receipt-content').innerHTML = `
                ID ORDER : ${trxId}<br>
                PRODUK   : ${data.productName}<br>
                HARGA    : Rp ${data.basePrice.toLocaleString()}<br>
                KODE UNIK: <span style="color:var(--gold)">${data.uniqueCode}</span><br>
                ----------------------------<br>
                TOTAL    : <strong style="color:var(--gold); font-size:1.1rem;">Rp ${data.total.toLocaleString()}</strong>
            `;

            // Update Steps
            const s1 = document.getElementById('s1'), s2 = document.getElementById('s2'), s3 = document.getElementById('s3');
            const msg = document.getElementById('track-msg');
            [s1, s2, s3].forEach(s => s.classList.remove('active'));

            s1.classList.add('active');
            msg.innerText = "Menunggu verifikasi pembayaran oleh Arsitek.";

            if (data.status === 'Process' || data.status === 'Success') {
                s2.classList.add('active');
                msg.innerText = "Pembayaran diterima! Pesanan sedang disiapkan.";
            }
            if (data.status === 'Success') {
                s3.classList.add('active');
                msg.innerText = "Selesai! Terima kasih telah berlangganan.";
            }
        }
    });
}

// 5. FILTER & LOGOUT
function filterData(cat, el) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const filtered = cat === 'All' ? productsData : productsData.filter(p => p.label === cat);
    renderShop(filtered);
}

function logoutSession() {
    if (confirm("Keluar dari RHF STORZ?")) {
        auth.signOut().then(() => window.location.replace("index.html"));
    }
}
