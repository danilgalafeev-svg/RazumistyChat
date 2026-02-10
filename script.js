const auth = document.getElementById('auth');
const chat = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const currentUserSpan = document.getElementById('currentUser');

let currentUser = localStorage.getItem('currentUser');
let messages = JSON.parse(localStorage.getItem('messages')) || [];

if (currentUser) {
  showChat();
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Введите логин и пароль');
    return;
  }

  let users = JSON.parse(localStorage.getItem('users')) || {};

  if (!users[username]) {
    users[username] = password;
  } else if (users[username] !== password) {
    alert('Неверный пароль');
    return;
  }

  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', username);
  currentUser = username;

  showChat();
}

function showChat() {
  auth.classList.add('hidden');
  chat.classList.remove('hidden');
  currentUserSpan.textContent = `👤 ${currentUser}`;
  renderMessages();
}

function logout() {
  localStorage.removeItem('currentUser');
  location.reload();
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;

  messages.push({
    user: currentUser,
    text,
    time: new Date().toLocaleTimeString()
  });

  localStorage.setItem('messages', JSON.stringify(messages));
  input.value = '';
  renderMessages();
}

function renderMessages() {
  messagesDiv.innerHTML = '';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<span>${msg.user}:</span> ${msg.text}`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
