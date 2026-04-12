// =============================================
// RHF SHOP - admin.js (Premium Admin Panel)
// Khusus untuk halaman admin.html
// =============================================

console.log("✅ RHF Admin JS Loaded - Premium Version");

const ADMIN_EMAIL = "gacoruncek73@gmail.com";
const db = firebase.database();

// ==================== TAMBAH PRODUK ====================

function tambahProduk() {
    const name = document.getElementById("prodName").value.trim();
    const price = parseInt(document.getElementById("prodPrice").value);
    const desc = document.getElementById("prodDesc").value.trim();
    const type = document.getElementById("prodType").value;

    if (!name || isNaN(price) || price <= 0) {
        showToast("Nama produk dan harga harus diisi dengan benar!", "error");
        return;
    }

    const productData = {
        name: name,
        price: price,
        description: desc || "Produk digital premium dari RHF Shop",
        type: type,                    // "auto" atau "manual"
        stock: 999,                    // stok default (bisa diatur nanti)
        timestamp: Date.now()
    };

    db.ref("products").push(productData)
        .then((snapshot) => {
            showToast(`✅ Produk "${name}" berhasil ditambahkan!`, "success");
            
            // Reset form
            document.getElementById("prodName").value = "";
            document.getElementById("prodPrice").value = "";
            document.getElementById("prodDesc").value = "";
        })
        .catch((error) => {
            console.error("Error tambah produk:", error);
            showToast("Gagal menambahkan produk. Silakan coba lagi.", "error");
        });
}

// ==================== LOAD ORDER REAL-TIME ====================

function loadOrders() {
    const tbody = document.querySelector("#ordersTable tbody");
    
    db.ref("orders").on("value", (snapshot) => {
        tbody.innerHTML = "";

        if (!snapshot.exists()) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:60px; color:#888;">
                        Belum ada order masuk saat ini
                    </td>
                </tr>`;
            return;
        }

        snapshot.forEach((child) => {
            const order = child.val();
            const orderId = child.key;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${order.productName}</strong></td>
                <td>${order.buyerName}</td>
                <td><a href="mailto:\( {order.buyerEmail}" style="color:#d4af37;"> \){order.buyerEmail}</a></td>
                <td>Rp ${formatRupiah(order.price)}</td>
                <td>
                    <span class="status ${order.status.includes('Sudah') ? 'status-sudah' : 'status-menunggu'}">
                        ${order.status || "Menunggu Konfirmasi"}
                    </span>
                </td>
                <td>
                    ${order.type === 'auto' ? 
                        '<span style="color:#4ade80;">✅ Otomatis</span>' : 
                        '<span style="color:#60a5fa;">📧 Manual</span>'}
                </td>
                <td>
                    <button class="btn-small" onclick="konfirmasiBayar('${orderId}')">Konfirmasi Bayar</button>
                    <button class="btn-small" onclick="kirimEmailAdmin('\( {orderId}', ' \){order.buyerEmail}', '${order.productName}')">Kirim Email</button>
                    ${order.type === 'auto' ? 
                        `<button class="btn-small" onclick="kirimLinkOtomatis('${orderId}')">Kirim Link Auto</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    });
}

// ==================== AKSI ADMIN ====================

// Konfirmasi pembayaran
function konfirmasiBayar(orderId) {
    if (confirm("Konfirmasi bahwa pembeli sudah membayar?")) {
        db.ref(`orders/${orderId}`).update({
            status: "Sudah Dibayar - Siap Kirim",
            updatedAt: Date.now()
        }).then(() => {
            showToast("Status berhasil diupdate menjadi 'Sudah Dibayar'", "success");
        }).catch(err => {
            showToast("Gagal update status", "error");
        });
    }
}

// Kirim email manual
function kirimEmailAdmin(orderId, buyerEmail, productName) {
    const pesan = prompt(`📧 Kirim email ke:\n${buyerEmail}\n\nProduk: ${productName}\n\nTulis pesan atau link download di sini:`);
    
    if (!pesan) return;

    const emailData = {
        to: buyerEmail,
        subject: `Konfirmasi & Pengiriman - ${productName} | RHF Shop`,
        message: pesan,
        orderId: orderId,
        timestamp: Date.now()
    };

    db.ref("emailQueue").push(emailData)
        .then(() => {
            showToast("✅ Pesan email berhasil disimpan ke antrian!", "success");
        })
        .catch(err => {
            showToast("Gagal menyimpan email", "error");
        });
}

// Kirim link otomatis (untuk produk tipe auto)
function kirimLinkOtomatis(orderId) {
    const linkDownload = prompt("Masukkan LINK DOWNLOAD untuk produk ini (dari Firebase Storage):");
    
    if (!linkDownload) return;

    db.ref(`orders/${orderId}`).update({
        status: "Sudah Dikirim - Link Download",
        downloadLink: linkDownload,
        sentAt: Date.now()
    }).then(() => {
        showToast("✅ Link download otomatis siap dikirim via email!", "success");
    }).catch(err => {
        showToast("Gagal menyimpan link", "error");
    });
}

// ==================== LOAD PRODUK DI ADMIN (Bonus) ====================

function loadProductsAdmin() {
    const container = document.getElementById("productsAdminList");
    if (!container) return;

    db.ref("products").on("value", (snapshot) => {
        container.innerHTML = "";
        snapshot.forEach((child) => {
            const p = child.val();
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <h3>${p.name}</h3>
                <p>Harga: Rp ${formatRupiah(p.price)}</p>
                <p>Tipe: ${p.type === 'auto' ? 'Otomatis' : 'Manual'}</p>
                <p>Stok: ${p.stock || 'Unlimited'}</p>
                <button onclick="editProduk('${child.key}')">Edit</button>
            `;
            container.appendChild(div);
        });
    });
}

// Fungsi placeholder untuk edit produk (bisa dikembangkan nanti)
function editProduk(productId) {
    alert("Fitur Edit Produk akan ditambahkan di update berikutnya.\n\nProduct ID: " + productId);
}

// ==================== INIT ADMIN PAGE ====================

function initAdminPage() {
    // Cek apakah user adalah admin
    firebase.auth().onAuthStateChanged((user) => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert("Akses ditolak! Hanya admin yang boleh masuk.");
            window.location.href = "login.html";
            return;
        }

        // Load data
        loadOrders();
        loadProductsAdmin();   // jika ada section daftar produk di admin
    });
}

// Export semua fungsi supaya bisa dipakai di admin.html
window.tambahProduk = tambahProduk;
window.konfirmasiBayar = konfirmasiBayar;
window.kirimEmailAdmin = kirimEmailAdmin;
window.kirimLinkOtomatis = kirimLinkOtomatis;
window.loadOrders = loadOrders;
window.initAdminPage = initAdminPage;
window.editProduk = editProduk;
