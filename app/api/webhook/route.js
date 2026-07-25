import { NextResponse } from 'next/server';

// GET request for Meta Webhook verification
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'my_verify_token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp Webhook verified successfully!');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST request to receive incoming WhatsApp messages and notifications
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received WhatsApp Webhook event:', JSON.stringify(body, null, 2));

    // Meta expects a 200 OK response quickly to acknowledge receipt
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error processing WhatsApp Webhook payload:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
