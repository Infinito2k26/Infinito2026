import Sidebar from "../../components/layout/sidebar";
import BottomNav from "../../components/layout/bottom-nav";
import PageFade from "../../components/layout/page-fade";
import styles from "../../components/layout/layout.module.css";
import AuthGuard from "../../components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className={styles.dashboardShell}>
        <Sidebar />

        <main className={styles.dashboardMain}>
          <PageFade>{children}</PageFade>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
