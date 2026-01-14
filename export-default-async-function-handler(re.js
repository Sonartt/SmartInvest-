export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!verifyMpesaIP(req)) return res.status(403).end();

  const body = req.body;

  if (body.BusinessShortCode !== process.env.MPESA_SHORTCODE) {
    return res.json({ ResultCode: 1 });
  }

  // Idempotency check
  if (await isDuplicate(body.TransID)) {
    return res.json({ ResultCode: 0 });
  }

  await saveTransaction(body);

  return res.json({
    ResultCode: 0,
    ResultDesc: "Success"
  });
}
