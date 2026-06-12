import { AuthForm } from "@/components/auth-form";
import { Navbar } from "@/components/navbar";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="section-shell flex min-h-[calc(100vh-2rem)] items-center py-8 md:py-12">
        <AuthForm mode="login" />
      </main>
    </>
  );
}
