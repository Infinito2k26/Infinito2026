import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <main style={{
      paddingTop: "70px"
    }}>
      <Navbar />
      <div>
        <h1>Welcome to Infinito 2K26</h1>
        <p>Frontend UI Shell Sandbox</p>
      </div>
      <Footer />
    </main>
  );
}