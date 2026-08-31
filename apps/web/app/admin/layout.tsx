import AuthGuard from "../../components/auth/AuthGuard";
import AdminSidebar from "../../components/layout/admin-sidebar";
import styles from "../../components/layout/layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className={styles.dashboardShell}>
        <AdminSidebar />
        <main className={styles.dashboardMain}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
