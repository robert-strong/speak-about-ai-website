"use server"

import { z } from "zod"

const schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

export async function submitChecklistForm(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get("email"),
  })

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || "Invalid input.",
      isSuccess: false,
    }
  }

  const email = validatedFields.data.email

  try {
    // Simulate a network request
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Here you would typically:
    // 1. Save the email to your database or CRM
    // 2. Send a confirmation email with the checklist link
    console.log(`New checklist request from: ${email}`)

    return {
      message: `Checklist link sent to ${email}!`,
      isSuccess: true,
    }
  } catch (e) {
    console.error(e)
    return {
      message: "An unexpected error occurred. Please try again.",
      isSuccess: false,
    }
  }
}
