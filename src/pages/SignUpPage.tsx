import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignUp 
        routing="path" 
        path="/sign-up" 
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            card: 'bg-card border border-border shadow-lg',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            socialButtonsBlockButton: 'bg-secondary text-secondary-foreground border-border hover:bg-accent',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'bg-background border-input text-foreground',
            footerActionLink: 'text-primary hover:text-primary/90',
          }
        }}
      />
    </div>
  );
}
