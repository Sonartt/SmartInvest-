# SmartInvest-

SmartInvest is a static landing page focused on financial literacy and investment tools for African users.

## Summary

- Landing page showcasing: Investment Academy, Insights, Tools, SME funding readiness, Community, Contact, and a demo Sign-In flow.
- Includes demo payment buttons (M-Pesa and PayPal) and accessibility/SEO improvements.

## Local preview

1. From the project root run a simple HTTP server:

```bash
python3 -m http.server 8000 --directory .
```

1. Open the site at: <http://localhost:8000/index.html>

## Development notes

- Built as a static HTML site that uses the Tailwind CDN.
- Accessibility: added skip-link, ARIA landmarks, visible focus styles, and proper button types.
- SEO: added meta description, Open Graph, Twitter card tags, canonical link, and JSON-LD Organization.
 - Payments: demo payment options include M-Pesa, PayPal, and a simple manual Bank transfer (KCB). The Bank transfer option records a pending transfer and shows account details for manual deposit. Recorded transfers are logged to `transactions.json`.
 - Admin: there is a minimal admin UI at `/admin.html` to view and manage KCB manual transfers. You can enable HTTP Basic auth for the admin UI by setting `ADMIN_USER` and `ADMIN_PASS` in your local `.env`.
 - Export & Reconcile: the admin UI supports CSV export of transfers and a simple reconcile endpoint where you can paste bank statement entries (JSON array) to automatically match and mark pending transfers as paid.

## Contributing

- Open a PR with changes; keep the site static and minimal.

## License

- Add a license file if you plan to open-source this project.

## Contact

- Repository: [SmartInvest- on GitHub](https://github.com/Sonartt/SmartInvest)
