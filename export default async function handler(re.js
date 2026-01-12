export default async function handler(req, res) {
  const paymentData = req.body;
  console.log("M-Pesa Callback:", paymentData);

  // Here you can update your database, send email, etc.

  res.status(200).json({ message: "Received" });
}
