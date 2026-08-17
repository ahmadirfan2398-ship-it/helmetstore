const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends an email notification via Brevo API when someone submits the contact form.
 * If BREVO_API_KEY is not set, it silently skips sending (logs a warning) so the
 * app doesn't crash during local development or testing.
 */
async function sendContactEmail({ name, email, phone, message }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Helmet Store';
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || apiKey === 'your_brevo_api_key_here' || !adminEmail) {
    console.warn('[Brevo] Email not sent - BREVO_API_KEY or ADMIN_EMAIL not configured in .env file.');
    return { skipped: true };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1E88E5;">New Contact Form Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${message}</p>
      <hr>
      <p style="font-size: 0.8rem; color: #999;">Sent from your Helmet Store contact form.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: adminEmail }],
        replyTo: { email: email, name: name },
        subject: `New message from ${name} - Helmet Store`,
        htmlContent
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('[Brevo] Email sent successfully. Message ID:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const errData = error.response ? error.response.data : error.message;
    console.error('[Brevo] Failed to send email:', errData);
    return { success: false, error: errData };
  }
}

async function sendOrderConfirmationEmail(order) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Helmet Store';
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || apiKey === 'your_brevo_api_key_here' || !adminEmail) {
    console.warn('[Brevo] Order confirmation email not sent - API key not configured.');
    return { skipped: true };
  }

  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:8px;border:1px solid #ddd;">${item.name_en}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.qty}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right;">Rs. ${(item.price * item.qty).toLocaleString()}</td>
    </tr>`
  ).join('');

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1E88E5;">New Order Placed - #${order.id}</h2>
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#1E88E5;color:#fff;">
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center;">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:1.2em;"><strong>Total: Rs. ${order.total.toLocaleString()}</strong></p>
      <hr>
      <p style="font-size:0.8rem;color:#999;">Sent from your Helmet Store.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: adminEmail }],
        subject: `New Order #${order.id} - Rs. ${order.total.toLocaleString()} - Helmet Store`,
        htmlContent
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('[Brevo] Order confirmation email sent. Message ID:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const errData = error.response ? error.response.data : error.message;
    console.error('[Brevo] Failed to send order confirmation email:', errData);
    return { success: false, error: errData };
  }
}

async function sendOrderStatusUpdateEmail(order, oldStatus) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Helmet Store';
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || apiKey === 'your_brevo_api_key_here' || !adminEmail) {
    console.warn('[Brevo] Order status update email not sent - API key not configured.');
    return { skipped: true };
  }

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
      <h2 style="color:#1E88E5;">Order Status Updated - #${order.id}</h2>
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city}</p>
      <p style="margin:16px 0;">
        <span style="background:#eee;padding:6px 12px;border-radius:4px;text-decoration:line-through;">${oldStatus}</span>
        &rarr;
        <span style="background:#1E88E5;color:#fff;padding:6px 12px;border-radius:4px;">${order.status}</span>
      </p>
      <p><strong>Total:</strong> Rs. ${order.total.toLocaleString()}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <hr>
      <p style="font-size:0.8rem;color:#999;">Sent from your Helmet Store.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: adminEmail }],
        subject: `Order #${order.id} status: ${oldStatus} → ${order.status} - Helmet Store`,
        htmlContent
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('[Brevo] Order status update email sent. Message ID:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    const errData = error.response ? error.response.data : error.message;
    console.error('[Brevo] Failed to send order status update email:', errData);
    return { success: false, error: errData };
  }
}

module.exports = { sendContactEmail, sendOrderConfirmationEmail, sendOrderStatusUpdateEmail };
