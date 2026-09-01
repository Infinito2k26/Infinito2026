import AuthGuard from "../../../components/auth/AuthGuard";

export default function CALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['CA', 'ADMIN']}>
      {children}
    </AuthGuard>
  );
}
