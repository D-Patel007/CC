import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ============================================
// EMAIL NOTIFICATION TYPES
// ============================================

type NewMessageNotificationData = {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  listingTitle: string;
  messagePreview: string;
  conversationUrl: string;
};

type ContentFlaggedNotificationData = {
  userEmail: string;
  userName: string;
  contentType: 'listing' | 'message' | 'profile' | 'event';
  contentTitle: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dashboardUrl: string;
};

type EventReminderData = {
  attendeeEmail: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventUrl: string;
  hoursUntilEvent: number;
};

type TransactionReceiptData = {
  transactionId: number;
  listingTitle: string;
  listingImage: string | null;
  price: number;
  meetupLocation: string | null;
  meetupDate: string | null;
  sellerName: string;
  sellerEmail: string;
  sellerRating: number;
  sellerReview: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerRating: number;
  buyerReview: string | null;
  completedAt: string;
};

function generateReceiptHTML(data: TransactionReceiptData, recipientRole: 'buyer' | 'seller'): string {
  const otherParty = recipientRole === 'buyer' ? 'seller' : 'buyer';
  const otherName = recipientRole === 'buyer' ? data.sellerName : data.buyerName;
  const myRating = recipientRole === 'buyer' ? data.buyerRating : data.sellerRating;
  const myReview = recipientRole === 'buyer' ? data.buyerReview : data.sellerReview;
  const theirRating = recipientRole === 'buyer' ? data.sellerRating : data.buyerRating;
  const theirReview = recipientRole === 'buyer' ? data.sellerReview : data.buyerReview;
  
  const stars = (rating: number) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Transaction Complete! 🎉</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.95; font-size: 16px;">Here's your receipt for transaction #${data.transactionId}</p>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Item Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 20px; font-weight: 600;">Transaction Details</h2>
                  </td>
                </tr>
                ${data.listingImage ? `
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <img src="${data.listingImage}" alt="${data.listingTitle}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 200px; object-fit: cover;" />
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td>
                    <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px;">
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">Item</td>
                        <td style="color: #1a202c; font-size: 14px; font-weight: 600; text-align: right; padding: 12px;">${data.listingTitle}</td>
                      </tr>
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">Price</td>
                        <td style="color: #667eea; font-size: 18px; font-weight: 700; text-align: right; padding: 12px;">$${data.price.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">Role</td>
                        <td style="color: #1a202c; font-size: 14px; font-weight: 600; text-align: right; padding: 12px;">${recipientRole === 'buyer' ? '🛒 Buyer' : '💰 Seller'}</td>
                      </tr>
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">${recipientRole === 'buyer' ? 'Seller' : 'Buyer'}</td>
                        <td style="color: #1a202c; font-size: 14px; font-weight: 600; text-align: right; padding: 12px;">${otherName}</td>
                      </tr>
                      ${data.meetupLocation ? `
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">📍 Meetup</td>
                        <td style="color: #1a202c; font-size: 14px; text-align: right; padding: 12px;">${data.meetupLocation}</td>
                      </tr>
                      ` : ''}
                      ${data.meetupDate ? `
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">🕐 Date</td>
                        <td style="color: #1a202c; font-size: 14px; text-align: right; padding: 12px;">${new Date(data.meetupDate).toLocaleString()}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #718096; font-size: 14px; padding: 12px;">✓ Completed</td>
                        <td style="color: #1a202c; font-size: 14px; text-align: right; padding: 12px;">${new Date(data.completedAt).toLocaleDateString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Ratings -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: #1a202c; font-size: 18px; font-weight: 600;">Ratings & Reviews</h3>
                  </td>
                </tr>
                
                <!-- Your Rating -->
                <tr>
                  <td style="background-color: #f7fafc; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; font-weight: 500;">YOUR RATING FOR ${otherName.toUpperCase()}</p>
                    <p style="margin: 0; font-size: 20px; letter-spacing: 2px;">${stars(myRating)}</p>
                    ${myReview ? `<p style="margin: 10px 0 0 0; color: #4a5568; font-size: 14px; font-style: italic;">"${myReview}"</p>` : ''}
                  </td>
                </tr>
                
                <tr><td style="height: 10px;"></td></tr>
                
                <!-- Their Rating -->
                <tr>
                  <td style="background-color: #f7fafc; border-radius: 8px; padding: 15px;">
                    <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; font-weight: 500;">${otherName.toUpperCase()}'S RATING FOR YOU</p>
                    <p style="margin: 0; font-size: 20px; letter-spacing: 2px;">${stars(theirRating)}</p>
                    ${theirReview ? `<p style="margin: 10px 0 0 0; color: #4a5568; font-size: 14px; font-style: italic;">"${theirReview}"</p>` : ''}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">Thank you for using Campus Connect!</p>
              <p style="margin: 0; color: #718096; font-size: 12px;">This is an automated receipt for your records.</p>
              <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 11px;">Transaction ID: #${data.transactionId}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendTransactionReceipt(data: TransactionReceiptData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not configured. Skipping email send.');
    return;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ SENDGRID_FROM_EMAIL not configured. Skipping email send.');
    return;
  }

  try {
    // Send receipt to buyer
    await sgMail.send({
      to: data.buyerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Transaction Receipt #${data.transactionId} - ${data.listingTitle}`,
      html: generateReceiptHTML(data, 'buyer'),
    });

    console.log('✅ Receipt sent to buyer:', data.buyerEmail);

    // Send receipt to seller
    await sgMail.send({
      to: data.sellerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Transaction Receipt #${data.transactionId} - ${data.listingTitle}`,
      html: generateReceiptHTML(data, 'seller'),
    });

    console.log('✅ Receipt sent to seller:', data.sellerEmail);
  } catch (error) {
    console.error('❌ Failed to send email receipt:', error);
    throw error;
  }
}

// ============================================
// NEW MESSAGE NOTIFICATION
// ============================================

export async function sendNewMessageNotification(data: NewMessageNotificationData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ SendGrid not configured. Skipping message notification.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">💬 New Message</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 15px 0; color: #1a202c; font-size: 16px;">Hi ${data.recipientName},</p>
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px;">
                <strong>${data.senderName}</strong> sent you a message${data.listingTitle ? ' about your listing' : ''}:
              </p>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                ${data.listingTitle ? `<p style="margin: 0 0 10px 0; color: #667eea; font-weight: 600; font-size: 14px;">${data.listingTitle}</p>` : ''}
                <p style="margin: 0; color: #4a5568; font-size: 14px; font-style: italic;">"${data.messagePreview}${data.messagePreview.length > 100 ? '...' : ''}"</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${data.conversationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Reply Now
                </a>
              </div>

              <p style="margin: 25px 0 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                Respond quickly to close the deal! 🎯
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Campus Connect - For Beacons, by Beacons
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const subject = data.listingTitle 
      ? `💬 ${data.senderName} messaged you about "${data.listingTitle}"`
      : `💬 ${data.senderName} sent you a message`;
    
    console.log('📤 Attempting to send email via SendGrid:', {
      to: data.recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject
    });
    
    const response = await sgMail.send({
      to: data.recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html,
    });
    
    console.log('✅ Message notification sent to:', data.recipientEmail);
    console.log('📬 SendGrid response:', response);
  } catch (error: any) {
    console.error('❌ Failed to send message notification:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
}

// ============================================
// CONTENT FLAGGED NOTIFICATION
// ============================================

export async function sendContentFlaggedNotification(data: ContentFlaggedNotificationData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ SendGrid not configured. Skipping moderation alert.');
    return;
  }

  const severityColors = {
    low: '#48bb78',
    medium: '#ed8936',
    high: '#f56565',
    critical: '#c53030',
  };

  const severityEmoji = {
    low: '⚠️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔴',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color: ${severityColors[data.severity]}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${severityEmoji[data.severity]} Content Moderation Alert</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 15px 0; color: #1a202c; font-size: 16px;">Hi ${data.userName},</p>
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px;">
                Your ${data.contentType} has been flagged for review by our moderation system.
              </p>
              
              <div style="background-color: #fff5f5; border-left: 4px solid ${severityColors[data.severity]}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 14px;">Content: ${data.contentTitle}</p>
                <p style="margin: 0 0 5px 0; color: #718096; font-size: 13px;"><strong>Reason:</strong> ${data.reason}</p>
                <p style="margin: 0; color: #718096; font-size: 13px;"><strong>Severity:</strong> ${data.severity.toUpperCase()}</p>
              </div>

              <div style="background-color: #edf2f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px; font-weight: 600;">What happens next?</p>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px;">
                  <li style="margin: 5px 0;">An admin will review your content</li>
                  <li style="margin: 5px 0;">You'll be notified of the decision</li>
                  <li style="margin: 5px 0;">Repeated violations may result in account suspension</li>
                </ul>
              </div>

              <p style="margin: 20px 0; color: #4a5568; font-size: 14px;">
                Please review our <strong>Community Guidelines</strong> to ensure your content complies with our policies.
              </p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  View Details
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Campus Connect - For Beacons, by Beacons
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await sgMail.send({
      to: data.userEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `${severityEmoji[data.severity]} Content Moderation Alert - Action Required`,
      html,
    });
    console.log('✅ Moderation alert sent to:', data.userEmail);
  } catch (error) {
    console.error('❌ Failed to send moderation alert:', error);
  }
}

// ============================================
// EVENT REMINDER
// ============================================

export async function sendEventReminder(data: EventReminderData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️ SendGrid not configured. Skipping event reminder.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🎉 Event Reminder</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 15px 0; color: #1a202c; font-size: 16px;">Hi ${data.attendeeName},</p>
              <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px;">
                Your event starts in <strong>${data.hoursUntilEvent} hours</strong>! 🕐
              </p>
              
              <div style="background-color: #fff5f7; border: 2px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0 0 15px 0; color: #1a202c; font-size: 22px; font-weight: 700;">${data.eventTitle}</h2>
                
                <div style="margin: 15px 0;">
                  <p style="margin: 8px 0; color: #4a5568; font-size: 15px;">
                    📅 <strong>When:</strong> ${new Date(data.eventDate).toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  <p style="margin: 8px 0; color: #4a5568; font-size: 15px;">
                    📍 <strong>Where:</strong> ${data.eventLocation}
                  </p>
                </div>
              </div>

              <div style="background-color: #edf2f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px; font-weight: 600;">💡 Quick Tips:</p>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px;">
                  <li style="margin: 5px 0;">Arrive a few minutes early</li>
                  <li style="margin: 5px 0;">Check the weather and dress accordingly</li>
                  <li style="margin: 5px 0;">Bring your student ID if required</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${data.eventUrl}" style="display: inline-block; background: #f5576c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  View Event Details
                </a>
              </div>

              <p style="margin: 25px 0 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                See you there! 🎊
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Campus Connect - For Beacons, by Beacons
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await sgMail.send({
      to: data.attendeeEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `🎉 Reminder: ${data.eventTitle} starts in ${data.hoursUntilEvent} hours!`,
      html,
    });
    console.log('✅ Event reminder sent to:', data.attendeeEmail);
  } catch (error) {
    console.error('❌ Failed to send event reminder:', error);
  }
}
