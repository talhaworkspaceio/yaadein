/**
 * Helper utility to send notifications via ntfy (https://ntfy.sh)
 */

export async function sendOrderNotification(orderData, customConfig = {}) {
  const serverUrl = (customConfig.serverUrl || process.env.NTFY_SERVER_URL || 'https://ntfy.sh').replace(/\/$/, '');
  const topic = customConfig.topic || process.env.NTFY_TOPIC || 'yaadein-orders';
  const authToken = customConfig.authToken || process.env.NTFY_AUTH_TOKEN;

  if (!topic) {
    console.warn('[ntfy] No topic configured. Skipping notification.');
    return { success: false, error: 'No topic configured' };
  }

  const orderId = orderData.orderId || 'N/A';
  const customerName = orderData.customer?.fullName || orderData.customer?.name || 'Customer';
  const phone = orderData.customer?.phone || 'N/A';
  const city = orderData.customer?.city || 'N/A';
  const paymentMethod = orderData.paymentMethod || 'N/A';
  const total = typeof orderData.total === 'number' ? `Rs. ${orderData.total.toLocaleString()}` : (orderData.total || 'N/A');

  // Format items summary
  let itemsSummary = '';
  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    itemsSummary = orderData.items
      .map((item) => `• ${item.quantity || 1}x ${item.frameName || item.title || item.name || 'Item'} (${item.price || ''})`)
      .join('\n');
  }

  const message = [
    `👤 Customer: ${customerName}`,
    `📞 Phone: ${phone}`,
    `📍 City: ${city}`,
    `💳 Payment: ${paymentMethod}`,
    `💰 Total: ${total}`,
    itemsSummary ? `\n📦 Items:\n${itemsSummary}` : '',
  ].filter(Boolean).join('\n');

  const payload = {
    topic: topic,
    title: `🛍️ New Order Received: #${orderId}`,
    message: message,
    priority: 4, // High priority
    tags: ['shopping_cart', "package", 'moneybag'],
  };

  // Add click action to phone dial if customer phone is available
  if (phone && phone !== 'N/A') {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone) {
      payload.actions = [
        {
          action: 'view',
          label: 'Call Customer',
          url: `tel:${cleanPhone}`,
        },
      ];
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const targetUrl = `${serverUrl}/${topic}`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ntfy] Delivery failed:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }

    const resData = await response.json().catch(() => ({}));
    console.log('[ntfy] Order notification sent successfully:', resData);
    return { success: true, data: resData };
  } catch (err) {
    console.error('[ntfy] Error dispatching notification:', err);
    return { success: false, error: err.message };
  }
}

export async function sendTestNotification(customConfig = {}) {
  const serverUrl = (customConfig.serverUrl || process.env.NTFY_SERVER_URL || 'https://ntfy.sh').replace(/\/$/, '');
  const topic = customConfig.topic || process.env.NTFY_TOPIC || 'yaadein-orders';
  const authToken = customConfig.authToken || process.env.NTFY_AUTH_TOKEN;

  if (!topic) {
    return { success: false, error: 'Topic name is required.' };
  }

  const payload = {
    topic: topic,
    title: '🔔 Yaadein Order Notifications Connected!',
    message: `Test notification sent successfully to topic "${topic}" at ${new Date().toLocaleTimeString()}.\nYour store is ready to send instant order push alerts.`,
    priority: 3,
    tags: ['white_check_mark', 'bell', 'tada'],
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const targetUrl = `${serverUrl}/${topic}`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    }

    const resData = await response.json().catch(() => ({}));
    return { success: true, data: resData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
