"use client"

import { useAdminSession } from "@/hooks/use-admin-session"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, LogOut, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

export function AdminSessionMonitor() {
  const { showWarning, timeUntilLogout, extendSession, logout } = useAdminSession({
    inactivityTimeout: 60 * 60 * 1000, // 1 hour
    warningTime: 5 * 60 * 1000, // 5 minutes before timeout
    checkInterval: 30 * 1000 // check every 30 seconds
  })

  const [displayTime, setDisplayTime] = useState<string>("")

  // Format time remaining
  useEffect(() => {
    if (timeUntilLogout === null) {
      setDisplayTime("")
      return
    }

    const minutes = Math.floor(timeUntilLogout / 60)
    const seconds = timeUntilLogout % 60

    if (minutes > 0) {
      setDisplayTime(`${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`)
    } else {
      setDisplayTime(`${seconds} second${seconds !== 1 ? 's' : ''}`)
    }
  }, [timeUntilLogout])

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base pt-2">
            Your admin session will expire due to inactivity in{" "}
            <span className="font-bold text-yellow-600">{displayTime}</span>.
          </DialogDescription>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              For security, you'll be automatically logged out after 1 hour of inactivity.
              Click <strong>"Stay Logged In"</strong> to extend your session.
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
          <Button
            onClick={extendSession}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
