import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  User, 
  LogOut, 
  ShieldCheck,
  Hash
} from 'lucide-react';

// Инициализация Firebase из глобальных переменных среды
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'simple-social-chat';

export default function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const messagesEndRef = useRef(null);

  // Скролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Эффект 1: Авторизация
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Ошибка авторизации:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Эффект 2: Получение сообщений из Firestore
  useEffect(() => {
    if (!user) return;

    // Путь согласно RULE 1: /artifacts/{appId}/public/data/{collectionName}
    const messagesQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Сортировка на стороне клиента (RULE 2: No complex queries/orderBy)
      const sortedMsgs = msgs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(sortedMsgs);
    }, (error) => {
      console.error("Ошибка Firestore:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Хендлер регистрации (обновление профиля)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      await updateProfile(auth.currentUser, { displayName: username });
      setIsRegistering(false);
      // Принудительное обновление локального стейта
      setUser({ ...auth.currentUser, displayName: username });
    } catch (err) {
      console.error("Ошибка при регистрации:", err);
    }
  };

  // Отправка сообщения
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chat_messages'), {
        text: newMessage,
        uid: user.uid,
        displayName: user.displayName || 'Аноним',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error("Ошибка при отправке:", err);
    }
  };

  // Экран регистрации/входа
  if (user && (!user.displayName && isRegistering)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Как вас зовут?</h1>
            <p className="text-slate-500 mt-2">Введите ваше имя, чтобы начать общение</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ваш никнейм..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              Войти в чат
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Главный экран чата
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Общий Чат</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs text-slate-500 font-medium">Онлайн</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-700">{user?.displayName || 'Аноним'}</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-tighter">UID: {user?.uid.slice(0, 8)}...</span>
          </div>
          {!user?.displayName ? (
             <button 
              onClick={() => setIsRegistering(true)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              title="Зарегистрироваться"
            >
              <ShieldCheck className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
              title="Выйти"
            >
              <LogOut className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
            <Hash className="w-12 h-12" />
            <p>Здесь пока нет сообщений. Будьте первым!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.uid === user?.uid ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-xs font-bold text-slate-500">
                  {msg.uid === user?.uid ? 'Вы' : msg.displayName}
                </span>
              </div>
              <div 
                className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                  msg.uid === user?.uid 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 pb-6 sm:pb-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            placeholder={user?.displayName ? "Напишите что-нибудь..." : "Нужно зарегистрироваться, чтобы писать"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!user?.displayName}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !user?.displayName}
            className={`p-3 rounded-xl transition-all shadow-md ${
              newMessage.trim() && user?.displayName
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
