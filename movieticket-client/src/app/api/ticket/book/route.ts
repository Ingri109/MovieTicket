import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = `${process.env.BACKEND_URL}/api`;

export async function POST(request: NextRequest) {
  // 1. Дістаємо токен прямо з кукі, які Next.js 100% отримає від браузера
  const token = request.cookies.get("jwt_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Зчитуємо тіло запиту (sessionId, seatId) від нашого клієнта
    const body = await request.json();

    // 3. Робимо сервер-сервер запит до твого C# бекенду
    // Тут CORS не існує, і ми залізобетонно передаємо токен в Header!
    const backendResponse = await fetch(`${BACKEND_URL}/ticket/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Передаємо як стандартний Bearer
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Backend server error" },
        { status: backendResponse.status }
      );
    }

    // Повертаємо клієнту успіх
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}