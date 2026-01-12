import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { phone, amount } = req.body;
  if (!phone || !amount) return res.status(400).json({ error: "Phone and amount required" });

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  try {
    // 1. Get access token
    const tokenRes = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(consumerKey + ":" + consumerSecret).toString("base64"),
        },
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Prepare STK Push request
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

    const body = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: "https://your-vercel-domain.vercel.app/api/m-pesa-callback",
      AccountReference: "SmartInvest",
      TransactionDesc: "Payment for SmartInvest Plan"
    };

    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const stkData = await stkRes.json();
    res.status(200).json(stkData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
}
