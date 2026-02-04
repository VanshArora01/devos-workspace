import { Link } from 'react-router-dom';
import { SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ArrowRight, Command, Terminal, Zap, Database, Code2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Terminal,
    title: 'Project Management',
    description: 'Track projects with status, tech stack, and repository links.',
  },
  {
    icon: Zap,
    title: 'Daily Logging',
    description: 'Low-friction daily work journal to capture progress and blockers.',
  },
  {
    icon: Database,
    title: 'API Testing',
    description: 'Built-in Postman-lite for saving and executing API requests.',
  },
  {
    icon: Code2,
    title: 'Code Snippets',
    description: 'Store and organize reusable code snippets by language.',
  },
];

const benefits = [
  'Unified workspace for all development activities',
  'Fast daily logging with minimal friction',
  'API testing without leaving your workflow',
  'Organized notes and knowledge base',
  'Snippet storage for quick reference',
  'Clean, professional interface',
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Command className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-lg">DevOS</span>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link to="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Log In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>
                    Sign Up
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              Built for developers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Your Developer
              <br />
              <span className="text-muted-foreground">Operating System</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              One workspace to manage projects, log daily work, test APIs, and store snippets. 
              Built for developers who value focus and efficiency.
            </p>
            <div className="flex items-center justify-center gap-4">
              {isSignedIn ? (
                <Link to="/dashboard">
                  <Button size="lg">
                    Open Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <Button size="lg">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </SignUpButton>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Core tools designed for daily developer workflows, without the complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Built for how developers actually work
              </h2>
              <p className="text-muted-foreground mb-6">
                DevOS removes the friction between thinking and doing. 
                Log your work, manage your projects, and keep your tools in one place.
              </p>
            </div>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your workflow?</h2>
          <p className="text-muted-foreground mb-8">
            Start using DevOS today. No credit card required.
          </p>
          {isSignedIn ? (
            <Link to="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignUpButton>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4" />
            <span>DevOS</span>
          </div>
          <p>Built for developers</p>
        </div>
      </footer>
    </div>
  );
}
