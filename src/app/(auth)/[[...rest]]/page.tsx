"use client"

import { SignIn } from "@clerk/nextjs"

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <SignIn />
    </main>
  )
}
