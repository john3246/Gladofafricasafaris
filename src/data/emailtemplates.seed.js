/**
 * E-mail templates (CMS > Email templates). Plain text with {{placeholders}}; the system wraps them in the branded
 * layout. `kind` decides where a template is used: automatic mails (team / guest) or quick replies in the inquiry inbox.
 */
const t = (key, kind, name, subject, body, extra = {}) => ({ key, kind, name, subject, body, enabled: true, ...extra });

module.exports = [
  t('inquiry-team', 'automatic', 'New request: alert to your team', 'New quote request: {{name}} ({{tour}})',
`New safari request on the website.

Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Tour: {{tour}}
Travel dates: {{dates}}
Travellers: {{travellers}} ({{adults}} adults, {{children}} children)
Styles: {{styles}}

Message:
{{message}}

Open in the CMS: {{adminUrl}}`, { system: true }),

  t('inquiry-guest', 'automatic', 'New request: automatic reply to the guest', 'We received your safari request, {{firstName}}',
`Hello {{firstName}},

Thank you for contacting {{company}}. We have received your request and one of our Arusha safari consultants is preparing your tailor-made itinerary and price.

Your request
Tour: {{tour}}
Travel dates: {{dates}}
Travellers: {{travellers}}
Styles: {{styles}}
Reference: {{reference}}

You will hear from us within 24 hours. If you have questions in the meantime, just reply to this email or message us on WhatsApp.

Warm regards,
The {{company}} team
{{phoneCompany}} | {{website}}`, { system: true }),

  t('reply-thanks', 'reply', 'Quick reply: Acknowledge', 'Your Tanzania safari quote - {{company}}',
`Hello {{firstName}},

Thank you for contacting {{company}}. We have received your request for {{tour}} and I am preparing your tailor-made itinerary and price.

You will hear from us within 24 hours. In the meantime, if you have any questions, just reply to this email or message us on WhatsApp.

Warm regards,
{{agent}}
{{company}}`),

  t('reply-details', 'reply', 'Quick reply: Ask for details', 'A few details to finalise your safari',
`Hello {{firstName}},

To prepare the best itinerary for you, could you please confirm:

1. Your preferred travel dates (you gave: {{dates}}) and how flexible you are
2. The number of adults and children, and their ages
3. Your accommodation preference: budget, midrange or luxury
4. Any special interests (migration, big cats, photography, Kilimanjaro, Zanzibar)

Thank you,
{{agent}}
{{company}}`),

  t('reply-quote', 'reply', 'Quick reply: Quote sent', 'Your tailor-made safari quote for {{tour}}',
`Hello {{firstName}},

Please find your tailor-made quote for {{tour}} ({{dates}}, {{travellers}} travellers). It includes park fees, accommodation, a private 4x4 with an expert guide and all meals as listed in the itinerary.

To hold the dates we ask for a deposit; I can send the payment details as soon as you are happy with the plan. Happy to adjust anything: lodges, length, extras.

Best wishes,
{{agent}}
{{company}}`),

  t('reply-followup', 'reply', 'Quick reply: Follow-up', 'Following up on your safari quote',
`Hello {{firstName}},

I wanted to check whether you had a chance to look at the quote we sent for {{tour}}. Safari camps fill quickly for peak months, so we would be happy to hold your dates while you decide.

Please let me know if you would like any changes.

Best wishes,
{{agent}}
{{company}}`),

  t('reply-unavailable', 'reply', 'Quick reply: Dates not available', 'Availability for your safari dates',
`Hello {{firstName}},

Thank you for your patience. Unfortunately the camps we would normally use for {{tour}} are fully booked on {{dates}}.

I can offer similar alternatives: shifting the dates by a few days, or a comparable itinerary with different lodges. Tell me which you prefer and I will send a new quote today.

Best wishes,
{{agent}}
{{company}}`),

  t('reply-booking-confirmed', 'reply', 'Quick reply: Booking confirmed', 'Your safari is confirmed: {{tour}}',
`Hello {{firstName}},

Wonderful news: your safari is confirmed.

Tour: {{tour}}
Dates: {{dates}}
Travellers: {{travellers}}

Next steps: we will send your final itinerary, a packing list and airport pick-up details. Please share your flight details when you have them.

Karibu Tanzania!
{{agent}}
{{company}}`),

  t('password-reset', 'automatic', 'Password reset: link to the CMS user', 'Reset your {{company}} CMS password',
`Hello {{firstName}},

We received a request to reset the password of your {{company}} CMS account.

Choose a new password here (the link works once and expires in {{expires}}):
{{resetUrl}}

If you did not ask for this, ignore this email: your password stays as it is.

{{company}}`, { system: true }),

  t('user-invite', 'automatic', 'Invitation: register as a CMS user', 'You are invited to the {{company}} CMS',
`Hello,

{{invitedBy}} invited you to the {{company}} website CMS as {{role}}.

Create your account here (the link works once and expires in {{expires}}):
{{inviteUrl}}

You will choose your own password. If you were not expecting this, ignore this email.

{{company}}`, { system: true }),
];
