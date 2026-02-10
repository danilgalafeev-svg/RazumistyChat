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
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

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
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    await createUserWithEmailAndPassword(auth, email, password);
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
