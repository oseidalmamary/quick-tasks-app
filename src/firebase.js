import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAtG4VKa5yESk5wm96vqeNsoF1fv1f4rUc",
    authDomain: "quick-tasks-app.firebaseapp.com",
    projectId: "quick-tasks-app",
    storageBucket: "quick-tasks-app.firebasestorage.app",
    messagingSenderId: "725396938279",
    appId: "1:725396938279:web:790ea8fc074554ec4c3802",
    measurementId: "G-KWR7DPCMGK"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// تصدير أدوات المصادقة (تسجيل الدخول) وقاعدة البيانات
export const auth = getAuth(app);
export const db = getFirestore(app);