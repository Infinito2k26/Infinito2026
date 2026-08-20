import PublicLayout from "@/components/layout/public-layout";
import Link from "next/link";
import Button from "@/components/ui/button";

export default function Home() {
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] text-center px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Welcome to <span className="text-blue-600">Infinito 2K26</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl">
          Join the biggest sports fest of Eastern India. Experience the thrill, the passion, and the infinity of sports!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
                <Button variant="secondary" size="lg">
                    Register Now
                </Button>
            </Link>
        </div>
      </div>
    </PublicLayout>
  );
}