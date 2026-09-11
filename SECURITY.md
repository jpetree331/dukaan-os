# Security policy

Dukaan OS currently trusts its device and browser profile. Login and staff controls prevent casual access through the app; they are not server-enforced authorization. Shop records and staff PINs remain plaintext in local browser storage. Encrypted exports protect the backup file, not an unlocked app or a compromised device.

Use a dedicated HTTPS origin and the generated public release. Do not deploy the repository root, share browser profiles among mutually untrusted people, or store customer backups in Git. A backend with independently enforced authorization is required before promising adversarial multi-user isolation.

Report suspected vulnerabilities privately to the repository maintainers using GitHub's private vulnerability reporting feature **if enabled**, or agree a private channel with the owner first. No monitored security email address is configured in this repository. Do not post customer data, passwords, PINs, backup files or live exploit details in public issues. Use synthetic reproduction data and identify the affected commit and browser.

The local activity log is editable and retains only the latest 800 entries. It is a convenience history, not a compliance log or forensic proof. Payments marked as UPI/card remain manual assertions, not payment-provider verification.

When a startup error occurs, preserve the browser profile; do not clear storage or reinstall to bypass the error. Use an owner-held backup for recovery. App-managed deletion cannot erase already downloaded files, browser/device backups or unlabelled legacy copies whose ownership cannot be established.
