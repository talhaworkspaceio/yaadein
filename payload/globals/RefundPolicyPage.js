export const RefundPolicyPage = {
  slug: 'refund-policy-page',
  label: 'Refund Policy Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'pageTitle',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Refund & Returns Policy',
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
      defaultValue: `At Yaadein, our dedication to traditional hand-craftsmanship means each photo frame is custom built to your specific dimensions and preferences. Please read our guidelines on refunds and returns below.

1. Custom Orders (Non-Refundable)
Because each custom frame is designed digitally by you and individually hand-made to order, we are unable to accept returns, exchanges, or issue refunds for changes of mind or errors made during customization (e.g., incorrect orientation, frame choice, uploaded image quality, or size inputs).

2. Damaged or Defective Items
In the rare event that your custom frame arrives damaged during courier shipping or possesses craftsmanship defects, we will construct and ship a replacement frame absolutely free of charge.
To request a free replacement:
• Inspect your package immediately upon delivery.
• Photograph the packaging damages, transit box, and the specific defective spots of the frame.
• Email the photographs along with your Reference Order ID to support@yaadein.com within 48 hours of delivery.

3. Incorrect Orders
If our workshop has mistakenly shipped a frame style or size different from your original design specifications, please contact us immediately, and we will rush your correct order to your doorstep without extra cost.`,
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
