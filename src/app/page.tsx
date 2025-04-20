import { Button } from "@/components/ui/button"
import { SignIn } from "@clerk/nextjs"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Content */}
        <div className="bg-primary text-primary-foreground p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Streamline Your Appointments
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8">
              The all-in-one appointment management system that helps you schedule,
              track, and optimize your client meetings efficiently.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/80" />
                <span>Smart appointment scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/80" />
                <span>Automated reminders and follow-ups</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/80" />
                <span>Calendar integration and sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Login Form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">
                Sign in to manage your appointments
              </p>
            </div>
            <div className="flex justify-center">
              <SignIn />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 