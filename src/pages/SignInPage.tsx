import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SignIn 
        routing="path" 
        path="/sign-in" 
        signUpUrl="/sign-up"
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
