import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { sendNewMessageNotification } from "@/lib/email"

/**
 * Test endpoint to verify SendGrid email functionality
 * DELETE THIS FILE after testing is complete
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { testEmail } = await req.json()

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json({ error: "Please provide a valid test email" }, { status: 400 })
    }

    console.log('🧪 Testing email to:', testEmail);

    // Send a test email
    await sendNewMessageNotification({
      recipientEmail: testEmail,
      recipientName: 'Test User',
      senderName: 'Email Test System',
      listingTitle: 'Test Listing',
      messagePreview: 'This is a test email to verify SendGrid is working correctly in production!',
      conversationUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/messages`
    });

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${testEmail}`,
      config: {
        hasSendGridKey: !!process.env.SENDGRID_API_KEY,
        hasSendGridFrom: !!process.env.SENDGRID_FROM_EMAIL,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
      }
    })
  } catch (error: any) {
    console.error('❌ Test email failed:', error);
    return NextResponse.json({ 
      error: "Failed to send test email",
      details: error.message,
      response: error.response?.body || null
    }, { status: 500 })
  }
}
