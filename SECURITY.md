# Security policy

## Reporting a vulnerability

Please do not open a public issue for suspected vulnerabilities, leaked credentials, authentication bypasses, private-data exposure, or deployment access problems.

Use GitHub private vulnerability reporting for this repository. Include:

- the affected endpoint, workflow, or component;
- reproducible steps;
- expected and observed behavior;
- the potential impact;
- any suggested remediation.

Do not access, modify, download, or retain data belonging to other users while testing.

## Supported code

Security fixes are applied to the current `main` branch. Production deployment should use only releases produced by the protected GitHub workflow after all checks pass.

## Credentials

If a credential is accidentally published, treat it as compromised even after deletion. Rotate the credential, review relevant logs, remove it from current files and history where appropriate, and invalidate derived sessions or tokens.
