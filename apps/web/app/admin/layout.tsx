import AuthGuard from "../../components/auth/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      {children}
    </AuthGuard>
  );
}
