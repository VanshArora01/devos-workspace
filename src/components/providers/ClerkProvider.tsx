import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY - authentication will not work');
}

interface Props {
  children: ReactNode;
}

export function ClerkProvider({ children }: Props) {
  const navigate = useNavigate();

  if (!PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <BaseClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </BaseClerkProvider>
  );
}
