// Meta WhatsApp Cloud API — no Twilio needed
// Env vars needed: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID, OWNER_WHATSAPP_NUMBER

// Bot knowledge base
const RESPONSES = {
  greeting: `👋 Welcome to *thefutureofmoney.ai*!

I'm here to help you learn about AI-managed crypto trading and team building with the Aurum Foundation.

What would you like to know?
1️⃣ AI-managed investing
2️⃣ Team building opportunity
3️⃣ How to get started
4️⃣ Talk to a human

Just type a number or ask any question!`,

  investing: `💰 *AI-Managed Investing (The Investor Path)*

• Deposit USDT into the Aurum platform
• The EX AI Bot — Aurum's proprietary algorithm — actively manages your portfolio across crypto and forex markets
• ~17% gross monthly return (vastly outperforming S&P 500)
• $100 minimum entry — low barrier access
• 100% of your principal goes to trading
• Full visibility via dashboard and Telegram app
• Withdrawals managed via Aurum backoffice

🔗 Learn more: https://thefutureofmoney.ai

Would you like to:
3️⃣ Get started
4️⃣ Talk to a human`,

  team: `🚀 *Team Building (The Builder Path)*

• Earn commissions by introducing new members to Aurum via your personal referral link
• Build and lead your own team structure
• Commission income from your referral activity
• Training materials and presentation templates
• Work remotely, grow internationally
• Scale through duplication — work from anywhere

🔗 Learn more: https://thefutureofmoney.ai

Would you like to:
3️⃣ Get started
4️⃣ Talk to a human`,

  getstarted: `🎯 *How to Get Started*

It's simple:

1. Visit our website: https://thefutureofmoney.ai
2. Watch the presentation video
3. Choose your path: Investor or Builder (or both!)
4. Message us and we'll guide you through registration

📧 Email: office@thefutureofmoney.ai

Would you like to leave your contact details so we can reach out? Just type:
*contact: Your Name, your@email.com*`,

  human: `👤 *Talk to a Human*

We'll get back to you as soon as possible — usually within a few hours.

📧 Email: office@thefutureofmoney.ai
🌐 Website: https://thefutureofmoney.ai/contact.html

You can also leave your details here:
Type *contact: Your Name, your@email.com*

We speak 🇬🇧 English · 🇸🇮 Slovenian · 🇩🇪 German`,

  risk: `⚠️ *Important Risk Disclosure*

• Past performance does not guarantee future results
• Cryptocurrency markets are highly volatile
• Never invest more than you can afford to lose
• Aurum operates from Hong Kong, outside EU MiCA regulations
• This is not financial advice — always do your own research

Full disclaimer: https://thefutureofmoney.ai/disclaimer.html`,

  contactSaved: (name, email) => `✅ *Thank you, ${name}!*

Your details have been saved:
📧 ${email}

Our team will reach out to you shortly. In the meantime, feel free to explore:
🔗 https://thefutureofmoney.ai`,

  fallback: `🤔 I'm not sure I understood that. Here's what I can help with:

1️⃣ AI-managed investing
2️⃣ Team building opportunity
3️⃣ How to get started
4️⃣ Talk to a human
5️⃣ Risk disclaimer

Just type a number or ask a question!`
};

// Keyword matching
function getResponse(message) {
  const msg = message.toLowerCase().trim();

  // Number shortcuts
  if (msg === '1') return RESPONSES.investing;
  if (msg === '2') return RESPONSES.team;
  if (msg === '3') return RESPONSES.getstarted;
  if (msg === '4') return RESPONSES.human;
  if (msg === '5') return RESPONSES.risk;

  // Contact capture: "contact: Name, email"
  const contactMatch = msg.match(/contact:\s*(.+?),\s*(\S+@\S+)/i);
  if (contactMatch) {
    const name = contactMatch[1].trim();
    const email = contactMatch[2].trim();
    return { type: 'contact', name, email, response: RESPONSES.contactSaved(name, email) };
  }

  // Greetings
  if (/^(hi|hello|hey|hej|zdravo|zivjo|živjo|halo|bok|ciao|servus|moin|hallo|good morning|good evening)/i.test(msg)) {
    return RESPONSES.greeting;
  }

  // Investing keywords
  if (/invest|trading|bot|ai\s|crypto|usdt|deposit|money|earn|passive|return|profit|yield|portfolio/i.test(msg)) {
    return RESPONSES.investing;
  }

  // Team keywords
  if (/team|build|referral|commission|network|mlm|partner|join|recruit|structure/i.test(msg)) {
    return RESPONSES.team;
  }

  // Getting started
  if (/start|begin|register|sign.?up|how\s(do|can|to)|open|account|apply/i.test(msg)) {
    return RESPONSES.getstarted;
  }

  // Human / contact
  if (/human|person|agent|speak|talk|call|contact|email|phone/i.test(msg)) {
    return RESPONSES.human;
  }

  // Risk
  if (/risk|safe|secure|scam|legit|legal|regulation|disclaimer|warning/i.test(msg)) {
    return RESPONSES.risk;
  }

  // Menu
  if (/menu|help|option|what can/i.test(msg)) {
    return RESPONSES.greeting;
  }

  return RESPONSES.fallback;
}

// Send message via Meta WhatsApp Cloud API
async function sendWhatsAppMessage(to, text) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Meta API error:', JSON.stringify(data));
  }
  return data;
}

// Notify owner about new lead
async function notifyOwner(leadName, leadEmail, leadPhone) {
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  if (!ownerNumber) {
    console.log('Owner notification skipped — OWNER_WHATSAPP_NUMBER not set');
    return;
  }

  try {
    await sendWhatsAppMessage(
      ownerNumber,
      `🔔 *New Lead from WhatsApp Bot!*\n\n👤 Name: ${leadName}\n📧 Email: ${leadEmail}\n📱 WhatsApp: ${leadPhone}\n\nReach out to them!`
    );
    console.log('Owner notified via WhatsApp');
  } catch (err) {
    console.error('Owner notification error:', err.message);
  }
}

exports.handler = async (event) => {
  // ── GET: Meta webhook verification ──
  if (event.httpMethod === 'GET') {
    const params = new URLSearchParams(event.queryStringParameters || {});
    // Meta sends these as query params directly
    const mode = event.queryStringParameters?.['hub.mode'] || params.get('hub.mode');
    const token = event.queryStringParameters?.['hub.verify_token'] || params.get('hub.verify_token');
    const challenge = event.queryStringParameters?.['hub.challenge'] || params.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'thefutureofmoney2026';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified ✅');
      return { statusCode: 200, body: challenge };
    }

    return { statusCode: 403, body: 'Forbidden' };
  }

  // ── POST: incoming WhatsApp messages ──
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Meta sends a complex nested structure
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Only process actual messages (not status updates)
    if (!value?.messages?.[0]) {
      return { statusCode: 200, body: 'OK — no message' };
    }

    const message = value.messages[0];
    const from = message.from; // sender phone number (e.g. "38641682838")
    const incomingMsg = message.text?.body || '';

    console.log(`WhatsApp message from ${from}: ${incomingMsg}`);

    // Mark as read
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: message.id
      })
    });

    // Get bot response
    const result = getResponse(incomingMsg);
    let responseText;

    if (typeof result === 'object' && result.type === 'contact') {
      responseText = result.response;
      console.log(`📬 NEW LEAD: ${result.name} — ${result.email} — from ${from}`);
      await notifyOwner(result.name, result.email, from);
    } else {
      responseText = result;
    }

    // Send reply
    await sendWhatsAppMessage(from, responseText);

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('WhatsApp bot error:', error);
    return { statusCode: 200, body: 'Error handled' };
  }
};
