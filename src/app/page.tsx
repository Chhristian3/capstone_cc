import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8 py-12">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Streamline Your Appointments
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                The all-in-one appointment management system that helps you schedule,
                track, and optimize your client meetings efficiently.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">Smart appointment scheduling</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">Seamless customer messaging</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">Calendar integration and sync</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button asChild size="lg" className="group">
                <Link href="/sign-in">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Content - Login Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl -rotate-6" />
            <div className="relative bg-card p-8 rounded-3xl shadow-xl border">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">Welcome Back</h2>
              </div>
              <div className="mt-8">
                <Button asChild className="w-full" size="lg">
                  <Link href="/sign-in" className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 