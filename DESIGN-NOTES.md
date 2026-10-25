# Contact, motion and solar concepts

The owner supplied the email address and two local mobile/WhatsApp numbers. The contact module centralizes the supplied data and normalizes phone links to Jordan's +962 country code. WhatsApp links open a message composer; nothing is sent automatically. Contact forms still store inquiries in PostgreSQL and are separate from email links.

## Research actually performed

A GitHub web search for solar-energy website design returned public references. Reviewed the SolarConnect README and its published screenshot, plus the Arkagrid HTML/CSS source:

- https://github.com/himanshu-jadhav108/SolarConnect — solar-themed yellow accents, clear consultation CTA and floating assistance control. The screenshot was inspected; its live site was not inspected.
- https://github.com/mohit-vb/arkagrid-solar-website — reviewed the hero/service hierarchy and hover-lift CSS in its source. Its live site was not inspected.

These are references for layout and interaction only. No third-party code, identity, copy, screenshots or imagery were incorporated into Open Energy. Google search and direct access to Sunrun, Otovo and Enpal returned HTTP 403 under the current network policy, so no findings are attributed to those sites.

## Implemented direction

Preserve Open Energy's yellow/navy identity and readable white space. Add entrance animation, scroll reveals, a reading-progress line, desktop hero parallax, interactive service diagrams, image zoom, a keyboard-accessible image lightbox, and a floating WhatsApp chooser. Reduced-motion preferences disable decorative motion and restore immediate visibility. Content stays visible when JavaScript is disabled or IntersectionObserver is unavailable.

The owner explicitly selected clearly labeled illustrative images. Three original AI-generated solar concept images are hosted locally as optimized WebP files: residential rooftop, commercial rooftop and battery storage. They are labeled as AI-generated concepts and are not represented as completed Open Energy projects or engineering specifications. They are kept separate from the verified PostgreSQL project portfolio.

## Editorial redesign and request notifications

Reviewed an additional public solar landing reference via GitHub search: https://github.com/Arbouchi-Ayoub/landing-page-modern-solar-indistry . Inspected its README and Hero component source (staggered content entrance, image framing, local media, and floating contact); no claim is made to have inspected its live site. Open Energy's new composition is original: oversized editorial typography, a light surface, asymmetric rooftop/business/storage cards, image-led service cards, rounded controls and a contrasting dark process section. Existing solar-yellow identity and clearly labeled concept imagery are retained. No third-party code/assets are copied.

Email request notifications use the Resend HTTP API. Request format and reply-to mapping were checked against the official Resend Node client README and implementation: https://github.com/resend/resend-node . See EMAIL-NOTIFICATIONS.md for configuration and actual verification limits.
