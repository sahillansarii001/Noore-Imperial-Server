import { env } from '../config/env.js';
// Assuming a generic HTTP client like node-fetch or axios is used, or native fetch
// If no specific library is installed, we can use native fetch

export const sendWhatsAppMessage = async (to, message) => {
  try {
    const url = `${env.WHATSAPP.API_URL}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.WHATSAPP.API_KEY}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message }
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  } catch (error) {
    console.error('WhatsApp API error:', error);
  }
};
