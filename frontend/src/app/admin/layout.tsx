import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@arifsmart/shared';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN]}>
      {children}
    </AuthGuard>
  );
}
