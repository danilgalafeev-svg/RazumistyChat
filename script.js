/* =========================
   1. ВИЗУАЛЬНЫЙ ИНДИКАТОР
   ========================= */
const indicator = document.createElement("div");
indicator.textContent = "✅ script.js загружен";
indicator.style.position = "fixed";
indicator.style.bottom = "10px";
indicator.style.right = "10px";
indicator.style.padding = "8px 12px";
indicator.style.background = "#22c55e";
indicator.style.color = "white";
indicator.style.borderRadius = "8px";
indicator.style.fontSize = "12px";
indicator.style.zIndex = "9999";
document.body.appendChild(indicator);

console.log("SCRIPT LOADED");

/* =========================
   2. FIREBASE IMPORTS
   ========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================
   3. FIREBASE CONFIG
   ========================= */
/* 🔥 ОБЯЗАТЕЛЬНО замени на свой */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQbqSyJqVuKFo_5fsC0vXDYyg96TnHIN0",
  authDomain: "razumistychat.firebaseapp.com",
  projectId: "razumistychat",
  storageBucket: "razumistychat.firebasestorage.app",
  messagingSenderId: "634434991920",
  appId: "1:634434991920:web:3b425be37b01d49cbdfaf5",
  measurementId: "G-QDS14TPQB0"
};

console.log("Before Firebase init");

/* =========================
   4. INIT
   ========================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase initialized");

/* =========================
   5. DOM ELEMENTS
   ========================= */
const authDiv = document.getElementById("auth");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const emailSpan = document.getElementById("userEmail");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageInput = document.getElementById("messageInput");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const sendBtn = document.getElementById("sendBtn");

/* =========================
   6. BUTTONS
   ========================= */
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", () => signOut(auth));
sendBtn.addEventListener("click", sendMessage);

/* =========================
   7. AUTH
   ========================= */
async function login() {
  console.log("LOGIN CLICKED");

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Введите email и пароль");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("SIGNED IN");
  } catch (err) {
    console.warn("SIGN IN FAILED:", err.code);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("USER CREATED");
    } catch (e) {
      alert(e.message);
    }
  }
}

onAuthStateChanged(auth, user => {
  console.log("AUTH STATE CHANGED:", user);

  if (user) {
    authDiv.classList.add("hidden");
    chatDiv.classList.remove("hidden");
    emailSpan.textContent = user.email;
    startChat();
  } else {
    authDiv.classList.remove("hidden");
    chatDiv.classList.add("hidden");
  }
});

/* =========================
   8. CHAT
   ========================= */
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    user: auth.currentUser.email,
    text: text,
    createdAt: serverTimestamp()
  });

  messageInput.value = "";
}

function startChat() {
  console.log("CHAT STARTED");

  const q = query(
    collection(db, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.className = "message";
      div.innerHTML = `<span>${msg.user}:</span> ${msg.text}`;
      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
