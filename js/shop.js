/**
 * RHF STORZ - Core Shop Logic
 * Berjalan di sisi Client (Browser)
 */

const db = firebase.database();
const auth = firebase.auth();

// Ambil elemen Grid Produk
const shopGrid = document.getElementById('shop-grid');
const loader = document.getElementById('loader');

let allProducts = []; // Tempat menyimpan data produk sementara

/**
 * 1. AMBIL DATA DARI FIREBASE
 */
function loadProducts() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Ubah objek Firebase menjadi Array
            allProducts = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            renderProducts(allProducts);
        } else {
            shopGrid.innerHTML = `<p style="color:#555; grid-column: 1/-1; text-align:center;">Belum ada produk yang tersedia.</p>`;
        }
        if (loader) loader.style.display = 'none';
    }, (error) => {
        console.error("Gagal ambil produk:", error);
    });
}

/**
 * 2. TAMPILKAN PRODUK KE HTML
 */
function renderProducts(products) {
    shopGrid.innerHTML = ''; // Bersihkan grid

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="badge">${product.label || 'New'}</div>
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">Rp ${product.price.toLocaleString('id-ID')}</p>
                <button class="btn-buy" onclick="checkout('${product.id}', '${product.name}', ${product.price})">
                    BELI SEKARANG
                </button>
            </div>
        `;
        shopGrid.appendChild(card);
    });
}

/**
 * 3. SISTEM FILTER KATEGORI
 */
function filterData(category, element) {
    // Ubah tampilan tombol filter
    document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');

    if (category === 'All') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.label === category);
        renderProducts(filtered);
    }
}

/**
 * 4. LOGIKA PEMBELIAN (CHECKOUT)
 */
function checkout(productId, productName, price) {
    const user = auth.currentUser;

    if (!user) {
        alert("Silakan login terlebih dahulu!");
        return window.location.replace("/");
    }

    const confirmBuy = confirm(`Konfirmasi pembelian ${productName} seharga Rp ${price.toLocaleString()}?`);

    if (confirmBuy) {
        const trxId = "TRX-" + Date.now();
        const dateNow = new Date().toLocaleString('id-ID');

        // Simpan data transaksi ke Firebase
        db.ref('transactions/' + trxId).set({
            trxId: trxId,
            userUid: user.uid,
            userName: user.displayName,
            userEmail: user.email,
            productId: productId,
            productName: productName,
            total: price,
            status: 'Pending', // Tahap 1: Di Proses (Default)
            date: dateNow
        }).then(() => {
            alert("Pesanan dikirim! Silakan hubungi admin untuk pembayaran.");
            // Scroll otomatis ke bagian tracking
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }).catch(err => {
            alert("Terjadi kesalahan: " + err.message);
        });
    }
}

// Jalankan pengambilan data saat script dimuat
loadProducts();
