"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Download, LogOut, Rocket, Users, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getWaitlistEntries, getNotificationSubscribers, sendNotification } from "@/lib/actions"
import { exportToCSV } from "@/lib/utils"
import Image from "next/image"

export default function AdminDashboard() {
  const router = useRouter()
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([])
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [notificationMessage, setNotificationMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({ type: "", message: "" })

  // Pagination state
  const [waitlistPage, setWaitlistPage] = useState(1)
  const [subscribersPage, setSubscribersPage] = useState(1)
  const itemsPerPage = 10
  const [itemsPerPageOption, setItemsPerPageOption] = useState("10")

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    // Fetch data
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const waitlist = await getWaitlistEntries()
      const notificationSubscribers = await getNotificationSubscribers()

      setWaitlistEntries(waitlist)
      setSubscribers(notificationSubscribers)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    router.push("/admin/login")
  }

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      setNotification({ type: "error", message: "Please enter a message" })
      return
    }

    setIsLoading(true)
    try {
      const result = await sendNotification(notificationMessage)

      if (result.success) {
        setNotification({ type: "success", message: result.success })
        setNotificationMessage("")
      } else if (result.error) {
        setNotification({ type: "error", message: result.error })
      }
    } catch (error) {
      setNotification({ type: "error", message: "An error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Export functions
  const handleExportWaitlist = () => {
    const data = waitlistEntries.map((entry) => ({
      "School Name": entry.school_name,
      Email: entry.email,
      Discount: entry.discount + "%",
      Date: new Date(entry.created_at).toLocaleString(),
    }))
    exportToCSV(data, "eduit-waitlist-schools")
  }

  const handleExportSubscribers = () => {
    const data = subscribers.map((sub) => ({
      Email: sub.email,
      Date: new Date(sub.created_at).toLocaleString(),
    }))
    exportToCSV(data, "eduit-notification-subscribers")
  }

  // Pagination logic
  const paginateData = (data: any[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage
    return data.slice(startIndex, startIndex + perPage)
  }

  const waitlistPaginated = paginateData(waitlistEntries, waitlistPage, Number.parseInt(itemsPerPageOption))
  const subscribersPaginated = paginateData(subscribers, subscribersPage, Number.parseInt(itemsPerPageOption))

  const totalWaitlistPages = Math.ceil(waitlistEntries.length / Number.parseInt(itemsPerPageOption))
  const totalSubscribersPages = Math.ceil(subscribers.length / Number.parseInt(itemsPerPageOption))

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPageOption(value)
    setWaitlistPage(1)
    setSubscribersPage(1)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-4 lg:px-6 h-16 flex items-center">
        <Link className="flex items-center justify-center" href="/">
         <Image src="/logo.png" alt="EduIT Logo" width={100} height={100} />
        </Link>
        <span className="ml-2 text-sm text-center text-gray-500 text-medium">Admin Dashboard</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Waitlist Schools</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{waitlistEntries.length}</div>
                <p className="text-xs text-muted-foreground">Schools with 50% discount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notification Subscribers</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscribers.length}</div>
                <p className="text-xs text-muted-foreground">Schools to notify at launch</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="waitlist">
            <TabsList>
              <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
              <TabsTrigger value="notifications">Notification Subscribers</TabsTrigger>
              <TabsTrigger value="send">Send Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="waitlist" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Waitlist Schools</CardTitle>
                    <CardDescription>Schools that have signed up for the 50% discount.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportWaitlist}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {waitlistEntries.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No schools on the waitlist yet.</p>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-3 gap-4 p-4 font-medium">
                          <div>School Name</div>
                          <div>Email</div>
                          <div>Date</div>
                          <div>Phone Number</div>
                        </div>
                        <div className="divide-y">
                          {waitlistPaginated.map((entry, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 p-4">
                              <div>{entry.school_name}</div>
                              <div>{entry.email}</div>
                              <div>{entry.phone_number}</div>
                              <div>{formatDate(entry.created_at)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Items per page:</p>
                          <Select value={itemsPerPageOption} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger className="w-16">
                              <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWaitlistPage((prev) => Math.max(prev - 1, 1))}
                            disabled={waitlistPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {waitlistPage} of {totalWaitlistPages || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWaitlistPage((prev) => Math.min(prev + 1, totalWaitlistPages))}
                            disabled={waitlistPage === totalWaitlistPages || totalWaitlistPages === 0}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Notification Subscribers</CardTitle>
                    <CardDescription>Schools that will be notified at launch.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSubscribers}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {subscribers.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No notification subscribers yet.</p>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <div className="grid grid-cols-2 gap-4 p-4 font-medium">
                          <div>Email</div>
                          <div>Date</div>
                        </div>
                        <div className="divide-y">
                          {subscribersPaginated.map((sub, index) => (
                            <div key={index} className="grid grid-cols-2 gap-4 p-4">
                              <div>{sub.email}</div>
                              <div>{formatDate(sub.created_at)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Items per page:</p>
                          <Select value={itemsPerPageOption} onValueChange={handleItemsPerPageChange}>
                            <SelectTrigger className="w-16">
                              <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscribersPage((prev) => Math.max(prev - 1, 1))}
                            disabled={subscribersPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            Page {subscribersPage} of {totalSubscribersPages || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscribersPage((prev) => Math.min(prev + 1, totalSubscribersPages))}
                            disabled={subscribersPage === totalSubscribersPages || totalSubscribersPages === 0}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="send" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Launch Notification</CardTitle>
                  <CardDescription>Notify all subscribers about your product launch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notification.message && (
                    <div
                      className={`p-3 text-sm rounded-md ${
                        notification.type === "success"
                          ? "bg-green-100 border border-green-200 text-green-600"
                          : "bg-red-100 border border-red-200 text-red-600"
                      }`}
                    >
                      {notification.message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter your launch announcement message..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <Button
                    onClick={handleSendNotification}
                    disabled={isLoading || subscribers.length === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : `Send to ${subscribers.length} Subscribers`}
                  </Button>

                  {subscribers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      You need subscribers before you can send notifications.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="border-t bg-white py-4 px-4 md:px-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">&copy; 2024 EduIT Admin Dashboard</div>
      </footer>
    </div>
  )
}

