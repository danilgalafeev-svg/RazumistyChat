import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔥 ВСТАВЬ СЮДА СВОЙ firebaseConfig */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* DOM */
const authDiv = document.getElementById("auth");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const emailSpan = document.getElementById("userEmail");

document.getElementById("loginBtn").onclick = login;
document.getElementById("logoutBtn").onclick = () => signOut(auth);
document.getElementById("sendBtn").onclick = sendMessage;

/* AUTH */
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Введите email и пароль");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (e) {
        alert(e.message);
      }
    } else {
      alert(err.message);
    }
  }
}

onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.classList.add("hidden");
    chatDiv.classList.remove("hidden");
    emailSpan.textContent = user.email;
    loadMessages();
  } else {
    authDiv.classList.remove("hidden");
    chatDiv.classList.add("hidden");
  }
});

/* CHAT */
async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    user: auth.currentUser.email,
    text,
    createdAt: serverTimestamp()
  });

  input.value = "";
}

function loadMessages() {
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
