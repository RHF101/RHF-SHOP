/**
 * RHF STORZ - Shop Logic
 * Menangani rendering produk, filter, dan sistem checkout.
 */

// State Produk
let allProducts = {};

/**
 * Fungsi Mengambil Data Produk dari Firebase
 */
function fetchProducts() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    db.ref('products').on('value', (snapshot) => {
        allProducts = snapshot.val();
        renderProducts(allProducts);
        if (loader) loader.style.display = 'none';
    }, (error) => {
        console.error("Gagal mengambil produk:", error);
    });
}

/**
 * Fungsi Render Produk ke Grid HTML
 * @param {Object} products - Objek produk dari Firebase
 */
function renderProducts(products) {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (!products) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Belum ada produk yang tersedia.</p>';
        return;
    }

    for (let id in products) {
        const p = products[id];
        
        // Penentuan Label/Badge
        let badgeHTML = '';
        if (p.label === 'Premium') badgeHTML = '<span class="p-label label-premium">Premium</span>';
        else if (p.label === 'Limited') badgeHTML = '<span class="p-label label-limited">Limited</span>';

        // Template Card Produk
        grid.innerHTML += `
            <div class="p-card">
                ${badgeHTML}
                <img src="${p.image || 'https://via.placeholder.com/260x160/111/d4af37?text=RHF+STORZ'}" class="p-img" alt="${p.name}">
                <h3 class="p-name">${p.name}</h3>
                <p class="p-desc">${p.description || 'Koleksi digital eksklusif RHF STORZ.'}</p>
                
                ${p.label === 'Limited' && p.expiry ? `<div style="font-size:0.7rem; color:#ff4757; margin-bottom:10px; font-weight:bold;">⏳ Berakhir: ${p.expiry}</div>` : ''}

                <div class="p-footer">
                    <span class="p-price">Rp ${p.price.toLocaleString('id-ID')}</span>
                    <span class="p-stock">Stok: ${p.stock || 0}</span>
                </div>
                
                <button class="btn-buy" onclick="handlePurchase('${id}', '${p.name}', ${p.price})">
                    Beli Sekarang
                </button>
            </div>
        `;
    }
}

/**
 * Fungsi Filter Kategori
 * @param {string} category - Label kategori (Premium/Limited/Standard/All)
 * @param {HTMLElement} element - Elemen tombol chip yang diklik
 */
function filterData(category, element) {
    // Update UI Chip
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (element) element.classList.add('active');

    if (category === 'All') {
        renderProducts(allProducts);
    } else {
        const filtered = {};
        for (let id in allProducts) {
            if (allProducts[id].label === category) {
                filtered[id] = allProducts[id];
            }
        }
        renderProducts(filtered);
    }
}

/**
 * Fungsi Handle Pembelian
 * Mengintegrasikan dengan fungsi processCheckout di app.js
 */
function handlePurchase(id, name, price) {
    // Pastikan fungsi processCheckout ada di app.js
    if (typeof processCheckout === "function") {
        processCheckout(id, name, price);
    } else {
        console.error("Fungsi processCheckout tidak ditemukan di app.js");
        alert("Sistem sedang maintenance, silakan hubungi admin.");
    }
}

// Inisialisasi pengambilan data saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    // Tunggu auth siap sebelum ambil data (opsional, tergantung kebijakan proteksi)
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchProducts();
        }
    });
});

