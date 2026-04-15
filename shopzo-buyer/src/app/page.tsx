"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        console.log("user",data);
        
        setUser(data.user);
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Welcome to Shopzo 👋</h1>
      <p className="mt-2">Logged in as: {user.id}</p>
    </main>
  );
}
