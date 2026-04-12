// js/firebase.js
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

console.log("✅ Firebase RHF Shop Connected - Premium Version");
