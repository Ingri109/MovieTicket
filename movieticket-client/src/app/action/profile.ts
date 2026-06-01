"use server";

import { cookies } from "next/headers";

const BACKEND_URL = `${process.env.BACKEND_URL}/api`;

if (!BACKEND_URL) {
  console.warn("Warning: BACKEND_URL is not defined in environment variables!");
}

export async function getUserProfileAndTickets() {
  // Додаємо await ось тут!
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;

  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  try {
    const [profileRes, ticketsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/user/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(`${BACKEND_URL}/ticket/my-tickets`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
    ]);

    if (profileRes.status === 401 || ticketsRes.status === 401) {
      return { error: "Unauthorized", status: 401 };
    }

    if (!profileRes.ok || !ticketsRes.ok) {
      return { error: "Failed to fetch data", status: 500 };
    }

    const profile = await profileRes.json();
    const tickets = await ticketsRes.json();

    return { success: true, profile, tickets };
  } catch (error) {
    return { error: "Internal Server Error", status: 500 };
  }
}