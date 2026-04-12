// =============================================
// RHF SHOP - app.js (Premium Version)
// Fungsi umum untuk semua halaman
// =============================================

console.log("✅ RHF Shop - app.js loaded");

// Inisialisasi Firebase (sudah dilakukan di firebase.js)
// Pastikan firebase.js sudah di-load sebelum app.js

const ADMIN_EMAIL = "gacoruncek73@gmail.com";

// ==================== FUNGSI AUTH ====================

// Cek status login dan update UI
function checkAuth(callback) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User logged in:", user.email);
            
            // Update nama user di header jika ada
            const userNameEl = document.getElementById("userName");
            if (userNameEl) {
                userNameEl.textContent = user.displayName || user.email.split('@')[0];
            }

            // Tampilkan link Admin hanya untuk admin
            const adminLink = document.getElementById("adminLink");
            if (adminLink) {
                if (user.email === ADMIN_EMAIL) {
                    adminLink.style.display = "inline";
                } else {
                    adminLink.style.display = "none";
                }
            }

            // Jalankan callback jika ada
            if (typeof callback === "function") {
                callback(user);
            }
        } else {
            console.log("User not logged in");
            // Redirect ke login jika di halaman yang butuh auth
            const currentPage = window.location.pathname.split("/").pop();
            if (currentPage === "shop.html" || currentPage === "admin.html") {
                window.location.href = "login.html";
            }
        }
    });
}

// Login dengan Google
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Login berhasil:", result.user.email);
            // Redirect ke halaman utama setelah login
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Login error:", error);
            alert("Login gagal: " + error.message);
        });
}

// Logout
function logout() {
    firebase.auth().signOut()
        .then(() => {
            console.log("Logout berhasil");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Logout error:", error);
            alert("Gagal logout: " + error.message);
        });
}

// ==================== FUNGSI ORDER ====================

// Buat order baru (dipakai di shop.html)
function createOrder(productId, productName, price, type = "manual") {
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert("Silakan login terlebih dahulu.");
        window.location.href = "login.html";
        return;
    }

    const orderData = {
        productId: productId,
        productName: productName,
        price: parseInt(price),
        buyerName: user.displayName || "Pembeli",
        buyerEmail: user.email,
        status: "Menunggu Konfirmasi Pembayaran",
        type: type,
        timestamp: Date.now(),
        updatedAt: Date.now()
    };

    firebase.database().ref("orders").push(orderData)
        .then(() => {
            alert(`✅ Order untuk "${productName}" berhasil dibuat!\n\nAdmin akan mengonfirmasi via email secepatnya.`);
        })
        .catch((error) => {
            console.error("Error creating order:", error);
            alert("Gagal membuat order. Silakan coba lagi.");
        });
}

// ==================== FUNGSI ADMIN ====================

// Update status order (dipakai di admin.html)
function updateOrderStatus(orderId, newStatus) {
    firebase.database().ref(`orders/${orderId}`).update({
        status: newStatus,
        updatedAt: Date.now()
    })
    .then(() => {
        console.log("Status updated to:", newStatus);
    })
    .catch((error) => {
        console.error("Error updating status:", error);
        alert("Gagal update status.");
    });
}

// Kirim email manual (simpan ke queue)
function sendManualEmail(orderId, buyerEmail, productName) {
    const message = prompt(`Kirim email ke ${buyerEmail}\n\nProduk: ${productName}\n\nTulis pesan / link download di sini:`);
    
    if (!message || message.trim() === "") return;

    const emailData = {
        to: buyerEmail,
        subject: `Konfirmasi Order - ${productName} | RHF Shop`,
        message: message,
        orderId: orderId,
        timestamp: Date.now()
    };

    firebase.database().ref("emailQueue").push(emailData)
        .then(() => {
            alert("✅ Pesan berhasil disimpan ke antrian email!\nAdmin akan mengirimkan email ini.");
        })
        .catch((error) => {
            console.error("Error saving email:", error);
            alert("Gagal menyimpan pesan email.");
        });
}

// ==================== UTILITY FUNCTIONS ====================

// Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

// Generate random ID (jika diperlukan)
function generateId() {
    return 'prod_' + Math.random().toString(36).substr(2, 9);
}

// Tampilkan pesan toast (notifikasi kecil)
function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "14px 28px";
    toast.style.borderRadius = "50px";
    toast.style.color = "#000";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
    
    if (type === "success") {
        toast.style.background = "#22c55e";
    } else if (type === "error") {
        toast.style.background = "#ef4444";
    } else {
        toast.style.background = "#d4af37";
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "all 0.4s";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Export fungsi supaya bisa dipakai di file HTML lain
window.checkAuth = checkAuth;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.createOrder = createOrder;
window.updateOrderStatus = updateOrderStatus;
window.sendManualEmail = sendManualEmail;
window.formatRupiah = formatRupiah;
window.showToast = showToast;
