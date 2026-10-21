# Atelier Hotel

A beige-toned interactive hotel-management wireframe based on this repository's requirements and workflow diagrams.

**[Open the private live preview](https://hotel-atelier-operations.gamingslayer20.chatgpt.site)** · [Implementation and prototype boundaries](wireframe/WIREFRAME.md)

The preview is owner-private and requires ChatGPT sign-in. Use **Switch role** to explore all nine staff personas. Use **Guest experience** for twelve rooms, locally generated QR codes, the “Click me to login” alternative and room-specific guest services.

## Try the main flows

1. Create a request, switch to the department dispatcher and assign eligible staff. Switch to the fulfiller to record progress, then use the supervisor to inspect completed work.
2. As Front Desk, register a room's guest name/email and confirm identity/stay verification. Open that room's QR or guest login link, request the generated password and enter the password from the actual email.
3. Submit a guest service request and return to the staff queue to follow its progress.
4. Explore handover, independent financial approval/execution/review, restricted incidents, access administration and configuration.

## Implementation

Source lives in [`wireframe/`](wireframe/): React/Vinext on the Sites Worker runtime, D1-backed operational state and server-only Resend email delivery. Original production architecture recommendations remain in the specification documents; the prototype's single-property persistence is not a migration of the full proposed PostgreSQL ER schema.

The role selector is an owner-only persona preview, not production employee authentication. Financial movements, PMS/POS operations and emergency dispatch are explicitly labeled demonstrations. Resend's default sender restricts recipients to the Resend account email; a verified domain is required for other guests. Runtime registrations and secrets are excluded from Git.

## Specification and workflows

- [Product requirements](PRD.md), [architecture](ARCHITECTURE.md), [interaction design](DESIGN.md)
- [Suggested stack](TECH_STACK.md), [implementation guide](IMPLEMENTATION_GUIDE.md), [ER diagrams](ER_DIAGRAMS.md)
- [Test plan](TEST_PLAN.md), [security](SECURITY.md), [decision register](DECISIONS.md), [project memory](MEMORY.md)
- [Workflow diagrams](workflow%20digrams/)

## Verification

The wireframe passes a production build, TypeScript checks and 15 domain tests. Local browser verification covered persisted request creation, scoped dispatcher assignment, QR generation, actual Resend password delivery with user-confirmed email login, and a guest service request appearing in the staff queue. Hosted deployment succeeded; hosted browser testing requires the owner's sign-in.
