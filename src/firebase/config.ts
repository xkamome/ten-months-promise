import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 從 .env 讀取 Firebase 設定
// 請在專案根目錄建立 .env 檔案，內容如下：
// VITE_FIREBASE_API_KEY=你的API金鑰
// VITE_FIREBASE_AUTH_DOMAIN=你的專案.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=你的專案ID
// VITE_FIREBASE_STORAGE_BUCKET=你的專案.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=你的發送者ID
// VITE_FIREBASE_APP_ID=你的APP_ID

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 只在有設定時才初始化
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

const app = hasConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

export { db, hasConfig };
