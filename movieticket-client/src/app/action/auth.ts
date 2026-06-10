"use server"; // Цей рядок обов'язковий. Він каже Next.js виконувати це лише на сервері

import { cookies } from "next/headers";
const BACKEND_URL = `${process.env.BACKEND_URL}/api`;

if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

export async function checkIsLoggedIn() {
  const cookieStore = await cookies();
  return cookieStore.has("jwt_token");
}

// 1. Дія для логіну
export async function loginAction(formData: Record<string, string>) {
  try {
    // Робимо POST запит до твого .NET сервера
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    if (!response.ok) {
      // Намагаємось прочитати повідомлення про помилку від C#
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Невірний email або пароль" };
    }

    const data = await response.json();
    const token = data.token; // Очікуємо, що твій бекенд повертає { "token": "ey..." }

    if (token) {
      // Безпечно записуємо токен у кукі
      const cookieStore = await cookies();
      cookieStore.set("jwt_token", token, {
        httpOnly: true, // Забороняє доступ до кукі з JavaScript (захист від хакерів)
        secure: process.env.NODE_ENV === "production", // На localhost працює без HTTPS, на сервері вимагатиме HTTPS
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // Токен житиме 7 днів
        path: "/", // Доступний на всіх сторінках сайту
      });
      return { success: true };
    }

    return { success: false, error: "Token not found in server response" };
  } catch (err) {
    console.error("Login API Error:", err);
    return { success: false, error: "Error connecting to backend server" };
  }
}

// 2. Дія для реєстрації
export async function registerAction(formData: Record<string, string>) {
  console.log("🚀 SENDING REQUEST TO:", `${BACKEND_URL}/auth/register`);
  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.password
      }),
    });

    if (!response.ok) {
      // 1. Читаємо відповідь як звичайний текст, щоб нічого не зламалося
      const rawText = await response.text(); 
      
      // 2. Виводимо статус і сам текст помилки в консоль Vercel
      console.error("🔥 RAW ERROR FROM AZURE | Status:", response.status, "Body:", rawText);
      
      // 3. Виводимо шматок помилки прямо на екран сайту, щоб ти одразу її побачив
      return { success: false, error: `Помилка сервера: ${rawText.substring(0, 100)}` };
    }

    return { success: true };
  } catch (err) {
    console.error("Register API Error:", err);
    return { success: false, error: "Server connection error" };
  }
}

// 3. Дія для виходу (щоб потім підключити до кнопки "Log out" у профілі)
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("jwt_token");
}