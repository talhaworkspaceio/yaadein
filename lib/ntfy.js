/**
 * Helper utility to send clean notifications via ntfy (https://ntfy.sh)
 */

export async function sendOrderNotification(orderData, customConfig = {}) {
  let serverUrl = customConfig.serverUrl || process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
  const topic = customConfig.topic || process.env.NTFY_TOPIC || 'yaadein-orders';
  const authToken = customConfig.authToken || process.env.NTFY_AUTH_TOKEN;

  if (!topic) {
    console.warn('[ntfy] No topic configured. Skipping notification.');
    return { success: false, error: 'No topic configured' };
  }

  // Ensure serverUrl is the base host (e.g. https://ntfy.sh) for JSON publishing
  serverUrl = serverUrl.replace(/\/$/, '');
  if (serverUrl.endsWith(`/${topic}`)) {
    serverUrl = serverUrl.slice(0, -(topic.length + 1));
  }

  const orderId = orderData.orderId || 'N/A';
  const customerName = orderData.customer?.fullName || orderData.customer?.name || 'Customer';
  const phone = orderData.customer?.phone || 'N/A';
  const city = orderData.customer?.city || 'N/A';
  const address = [orderData.customer?.address, orderData.customer?.state, orderData.customer?.zip]
    .filter(Boolean)
    .join(', ');

  const paymentMethod = orderData.paymentMethod || 'N/A';
  const total = typeof orderData.total === 'number' ? `Rs. ${orderData.total.toLocaleString()}` : (orderData.total || 'N/A');

  // Format clean, easy-to-read items list
  let itemsList = '';
  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    itemsList = orderData.items
      .map((item, idx) => {
        const name = item.frameName || item.title || item.name || 'Item';
        const price = item.price ? ` (${item.price})` : '';
        const qty = item.quantity ? ` x${item.quantity}` : '';
        return `${idx + 1}. ${name}${qty}${price}`;
      })
      .join('\n');
  }

  const messageLines = [
    `👤 Name: ${customerName}`,
    `📞 Phone: ${phone}`,
    `📍 City: ${city}${address ? ` (${address})` : ''}`,
    `💳 Payment: ${paymentMethod}`,
    `💰 Total: ${total}`,
  ];

  if (itemsList) {
    messageLines.push(`\n📦 Items:\n${itemsList}`);
  }

  const message = messageLines.join('\n');

  const payload = {
    topic: topic,
    title: `🛍️ New Order: #${orderId}`,
    message: message,
    priority: 4, // High priority alert
    tags: ['shopping_cart', 'package', 'moneybag'],
  };

  // Add Call Customer button action
  if (phone && phone !== 'N/A') {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone) {
      payload.actions = [
        {
          action: 'view',
          label: 'Call Customer 📞',
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
    // POST JSON directly to root server endpoint (https://ntfy.sh) so ntfy parses JSON fields correctly
    const response = await fetch(serverUrl, {
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
  let serverUrl = customConfig.serverUrl || process.env.NTFY_SERVER_URL || 'https://ntfy.sh';
  const topic = customConfig.topic || process.env.NTFY_TOPIC || 'yaadein-orders';
  const authToken = customConfig.authToken || process.env.NTFY_AUTH_TOKEN;

  if (!topic) {
    return { success: false, error: 'Topic name is required.' };
  }

  serverUrl = serverUrl.replace(/\/$/, '');
  if (serverUrl.endsWith(`/${topic}`)) {
    serverUrl = serverUrl.slice(0, -(topic.length + 1));
  }

  const payload = {
    topic: topic,
    title: '🔔 Store Notifications Connected!',
    message: `Success! Your app is connected to "${topic}".\nNew customer orders will appear here automatically with full details and quick actions.`,
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
    const response = await fetch(serverUrl, {
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
