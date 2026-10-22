# Custom website domains

Connected on 2026-10-22 to `atelier-hotel-preview` in `chinmaya-beheras-projects`:

- https://devatelier.tech/login
- https://www.devatelier.tech/login
- Fallback: https://atelier-hotel-preview.vercel.app/login

Both project domains are verified. Vercel reports the www configuration as valid, with no conflicts. Registration remains at get.tech; only the Vercel domain association was claimed into the intended team.

The registrar has saved these authoritative nameservers:

```text
tech-domains.mercury.orderbox-dns.com
tech-domains.venus.orderbox-dns.com
tech-domains.earth.orderbox-dns.com
tech-domains.mars.orderbox-dns.com
```

Manage active DNS records at get.tech. Do not combine this set with Vercel nameservers. Verification and Resend records were also copied into the previous Vercel DNS zone, with explicit user approval, to cover cached delegation during propagation. Keep the existing email records intact when changing website records.

Project verification TXT records at `_vercel.devatelier.tech`:

```text
vc-domain-verify=devatelier.tech,4e05cc77dd4690a002d8
vc-domain-verify=www.devatelier.tech,8a1599e222569c334005
```

Verification: apex login returned HTTP 200 over ordinary HTTPS and displayed the correct hotel UI. The www hostname returned HTTP 200 with valid TLS using the IP reported by Vercel. Google DNS resolved www correctly, but the execution machine's default resolver and browser still intermittently returned an old negative DNS response. Therefore universal propagation is not claimed. A custom-domain API smoke run passed eight role checks before a connection reset; the complete run was not recorded as passing. Existing Vercel-hosted account checks remain documented separately.

When diagnosing future domain issues, use `vercel domains verify <hostname> --project atelier-hotel-preview --format=json --scope chinmaya-beheras-projects` and compare authoritative DNS with public resolvers. Read the project-specific recommended records from that output rather than assuming a universal Vercel IP or CNAME.
