import { ReactNode } from "react";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4 md:px-8">
        {children}
      </main>
    </div>
  );
}
