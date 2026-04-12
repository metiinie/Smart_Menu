import { AuthGuard } from '@/components/auth/AuthGuard';
import { Role } from '@arifsmart/shared';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.KITCHEN, Role.ADMIN]}>
      {children}
    </AuthGuard>
  );
}
