import Sidebar from "../../components/layout/sidebar";
import BottomNav from "../../components/layout/bottom-nav";
import styles from "../../components/layout/layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardShell}>
      <Sidebar />
      
      <main className={styles.dashboardMain}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
