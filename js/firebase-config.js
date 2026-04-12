/**
 * RHF STORZ - Firebase Configuration
 * Dedicated for Asia-Southeast1 (Singapore) Region
 */

const firebaseConfig = {
    apiKey: "AIzaSyCVqKwHmRBxWu5hjulwmhradnGbp0yFhbY",
    authDomain: "rhf-shop.firebaseapp.com",
    databaseURL: "https://rhf-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rhf-shop",
    storageBucket: "rhf-shop.firebasestorage.app",
    messagingSenderId: "1065902539657",
    appId: "1:1065902539657:web:ccb3cbdbecdcf81eb81758",
    measurementId: "G-HLNZZ2E26F"
};

// Inisialisasi Firebase agar tidak terjadi error double-init
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Inisialisasi Service Utama
const auth = firebase.auth();
const db = firebase.database();

// Log status untuk debugging di konsol browser
console.log("RHF-Core: Firebase Engine Connected.");

