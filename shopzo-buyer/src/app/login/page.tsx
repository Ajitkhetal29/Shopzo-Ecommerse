import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Shopzo Buyer",
  description: "Sign in to your Shopzo buyer account",
};

export default function LoginPage() {
  return <LoginForm />;
}
