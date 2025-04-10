// @ts-nocheck
import { redirect } from "next/navigation"
import { clerkClient } from "@clerk/nextjs/server"

import { checkRole } from "@/lib/roles"
import { AdminAppointmentList } from "@/components/admin/AdminAppointmentList"

import { removeRole, setRole } from "./_action"
import { SearchUsers } from "./SearchUsers"

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>
}) {
  
  const query = (await params.searchParams).search

  const client = await clerkClient()

  const users = query ? (await client.users.getUserList({ query })).data : []
  console.log(users)
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <p className="mb-4">
          This is the protected admin dashboard restricted to users with the
          `admin` role.
        </p>

        <SearchUsers />

        <div className="space-y-4 mt-4">
          {users.map((user) => {
            return (
              <div key={user.id} className="p-4 border rounded-lg">
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {
                    user.emailAddresses.find(
                      (email) => email.id === user.primaryEmailAddressId
                    )?.emailAddress
                  }
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {user.publicMetadata.role as string}
                </div>

                <div className="flex gap-2">
                  <form action={setRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <input type="hidden" value="admin" name="role" />
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Make Admin
                    </button>
                  </form>
                  <form action={setRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <input type="hidden" value="moderator" name="role" />
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Make Moderator
                    </button>
                  </form>
                  <form action={removeRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove Role
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Appointment Management</h2>
        <AdminAppointmentList />
      </div>
    </div>
  )
}
