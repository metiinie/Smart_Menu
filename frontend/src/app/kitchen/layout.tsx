import { AuthGuard } from '@/components/auth/AuthGuard';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['KITCHEN', 'ADMIN']}>
      {children}
    </AuthGuard>
  );
}
