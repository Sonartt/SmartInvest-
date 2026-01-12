<input type="tel" id="phone" placeholder="2547XXXXXXXX" />
<input type="number" id="amount" placeholder="Amount" />
<button id="payBtn">Pay with M-Pesa</button>

<script>
  document.getElementById("payBtn").addEventListener("click", async () => {
    const phone = document.getElementById("phone").value;
    const amount = document.getElementById("amount").value;

    const res = await fetch("/api/m-pesa-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, amount }),
    });

    const data = await res.json();
    if (data.ResponseCode === "0") {
      alert("STK Push sent. Check your phone to complete payment.");
    } else {
      alert("Payment failed: " + JSON.stringify(data));
    }
  });
</script>
