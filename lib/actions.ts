"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
}

// Create the client only if we have the required values
const supabase = createClient(
  supabaseUrl || "", // Fallback to empty string to prevent initialization error
  supabaseServiceKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Function to subscribe to notifications (just email)
export async function subscribeToNotifications(email: string) {
  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address" }
  }

  try {
    // First, let's check if the table exists by trying to get its structure
    const { error: tableCheckError } = await supabase.from("notifications").select("id").limit(1)

    if (tableCheckError) {
      console.error("Table check error:", tableCheckError)
      // If table doesn't exist, create it
      const { error: createTableError } = await supabase.rpc("create_notifications_if_not_exists")
      if (createTableError) {
        console.error("Failed to create table:", createTableError)
        return { error: "Database setup issue. Please contact support." }
      }
    }

    // Check if email already exists in notifications table
    const { data: existingNotification, error: checkError } = await supabase
      .from("notifications")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing notification:", checkError)
      return { error: "Failed to check subscription status." }
    }

    if (existingNotification) {
      return { error: "This email is already subscribed for notifications" }
    }

    // Insert into notifications table with simplified data structure
    const { error: insertError } = await supabase.from("notifications").insert({ email })

    if (insertError) {
      console.error("Error inserting notification:", insertError)
      return { error: "Failed to subscribe. Database error." }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error subscribing to notifications:", error)
    return { error: "Failed to subscribe. Please try again." }
  }
}

// Function to join waitlist (school name and email)
export async function joinWaitlist(schoolName: string, email: string) {
  if (!schoolName || !schoolName.trim()) {
    return { error: "Please provide a school name" }
  }

  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address" }
  }

  try {
    // Check if waitlist table exists
    const { error: tableCheckError } = await supabase.from("waitlist").select("id").limit(1)

    if (tableCheckError) {
      console.error("Table check error:", tableCheckError)
      // If table doesn't exist, create it
      const { error: createTableError } = await supabase.rpc("create_waitlist_if_not_exists")
      if (createTableError) {
        console.error("Failed to create table:", createTableError)
        return { error: "Database setup issue. Please contact support." }
      }
    }

    // Check if email already exists in waitlist table
    const { data: existingWaitlist, error: checkError } = await supabase
      .from("waitlist")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing waitlist entry:", checkError)
      return { error: "Failed to check waitlist status." }
    }

    if (existingWaitlist) {
      return { error: "This school is already on our waitlist" }
    }

    // Insert into waitlist table with simplified structure
    const { error: insertError } = await supabase.from("waitlist").insert({
      school_name: schoolName,
      email,
      discount: 50,
    })

    if (insertError) {
      console.error("Error inserting waitlist entry:", insertError)
      return { error: "Failed to join waitlist. Database error." }
    }

    // Also add to notifications table if not already there
    await subscribeToNotifications(email)

    revalidatePath("/")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error joining waitlist:", error)
    return { error: "Failed to join waitlist. Please try again." }
  }
}

// Function to get all waitlist entries
export async function getWaitlistEntries() {
  try {
    const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching waitlist entries:", error)
    return []
  }
}

// Function to get all notification subscribers
export async function getNotificationSubscribers() {
  try {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching notification subscribers:", error)
    return []
  }
}

// Function to send notification to all subscribers
export async function sendNotification(message: string) {
  if (!message || !message.trim()) {
    return { error: "Please provide a message" }
  }

  try {
    // Get all notification subscribers
    const subscribers = await getNotificationSubscribers()

    // In a real application, you would integrate with an email service here
    // For now, we'll just log the message and return success
    console.log(`Sending notification to ${subscribers.length} subscribers: ${message}`)

    // Record the notification in the database
    const { error } = await supabase.from("sent_notifications").insert([
      {
        message,
        recipients_count: subscribers.length,
        sent_at: new Date().toISOString(),
      },
    ])

    if (error) throw error

    return { success: `Notification sent to ${subscribers.length} subscribers` }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { error: "Failed to send notification. Please try again." }
  }
}

