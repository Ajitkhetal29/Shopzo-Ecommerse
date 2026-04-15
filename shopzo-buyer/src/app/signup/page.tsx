import type { Metadata } from "next";
import AuthForm from "@/components/AuthFotm";

export const metadata: Metadata = {
  title: "Sign up | Shopzo Buyer",
  description: "Create your Shopzo buyer account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen">
      <AuthForm defaultMode="signup" />
    </div>
  );
}
