import { NextResponse } from 'next/server';
import { sendOrderNotification, sendTestNotification } from '../../../lib/ntfy';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, orderData, topic, serverUrl } = body || {};

    if (action === 'test') {
      const result = await sendTestNotification({ topic, serverUrl });
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Test notification sent successfully!' });
      } else {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send test notification' },
          { status: 400 }
        );
      }
    }

    // Default action: send order notification
    if (!orderData) {
      return NextResponse.json({ success: false, error: 'Missing orderData in request body' }, { status: 400 });
    }

    const result = await sendOrderNotification(orderData, { topic, serverUrl });
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch ntfy alert' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/notify API route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
