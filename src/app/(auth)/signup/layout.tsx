import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Start Free',
  description:
    'Create your free PostPika account. Generate AI-powered LinkedIn posts in 30 seconds. No credit card needed.',
  robots: { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
