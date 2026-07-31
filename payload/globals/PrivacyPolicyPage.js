export const PrivacyPolicyPage = {
  slug: 'privacy-policy-page',
  label: 'Privacy Policy Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'pageTitle',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Privacy Policy',
    },
    {
      name: 'lastUpdated',
      type: 'text',
      label: 'Last Updated Date Text',
      defaultValue: 'Last updated: July 2026',
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Full Policy Content / Description (replaces whole body)',
      defaultValue: `At Yaadein, we value your trust and privacy. This Privacy Policy details how we collect, store, and safeguard your personal information when you use our website, custom framing tools, and purchasing services.

1. Information We Collect
We collect details you provide to us directly through various forms on the site:
• Contact Information: Name, email address, phone number, and street address provided during checkout or contact form submission.
• Uploaded Files: Custom photographic images uploaded to our frame designer. These are securely processed for fine art printing purposes.
• Newsletter Subscription: Email address provided to sign up for newsletter promos.

2. How We Use Your Information
We process your data strictly to fulfill order operations and communicate updates:
• To build and deliver your handcrafted custom picture frames.
• To coordinate secure shipment and delivery operations with our national courier network in Pakistan.
• To answer questions or support requests submitted via the contact form.
• To send promotional emails and discount alerts if you subscribed to our newsletter.

3. Security & Storage
We leverage Firebase services for secure database hosting. Your uploaded images are stored securely on Cloudinary and Firebase cloud storage solely for the purpose of printing, and are not shared with third parties.`,
    },
    {
      name: 'introText',
      type: 'textarea',
      label: 'Introductory Paragraph (Optional)',
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Policy Sections (Optional Array)',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section Title',
        },
        {
          name: 'content',
          type: 'textarea',
          label: 'Section Content Text',
        },
      ],
    },
  ],
}
