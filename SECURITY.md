# Security Policy

## Reporting a Vulnerability

Please open a private security advisory on GitHub if you find a vulnerability.

Do not include secrets, API keys, production tokens, or private user data in public issues.

## Upload Security Notes

- Never ship provider secrets in a mobile app.
- Cloudinary API secrets, S3 secrets, and backend signing keys must stay on a server.
- Prefer server-generated signatures for privileged upload flows.
- Validate file size and MIME type on both the client and server.
- Treat client-provided file names and MIME types as untrusted input.
