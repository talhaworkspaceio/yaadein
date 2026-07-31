export const TermsPage = {
  slug: 'terms-page',
  label: 'Terms & Conditions Page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'pageTitle',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Terms & Conditions',
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
      defaultValue: `Welcome to Yaadein. By accessing our website, purchasing our custom picture frames, or using our photo restoration services, you agree to comply with and be bound by the following Terms & Conditions.

1. Product Customization & Ordering
Our customizer studio provides live mockups of handbuilt picture frames. Due to the natural materials used (solid woods like oak and walnut), wood grain patterns and slight color tones may vary from the digital preview rendering.
By placing an order, you confirm that you have double-checked your customized dimensions, orientations, mat sizes, and uploaded print images.

2. Custom Work Finality
Since every order is handcrafted from scratch to your specific dimensions and design selections, they cannot be resold. Thus, all bespoke orders are final upon payment confirmation or shipping initiation.

3. Payment & Verification
We support secure prepaid transfers via EasyPaisa, JazzCash, and Bank Transfer across Pakistan. Payment must be verified before our craftsmen begin hand-building your custom frames. Unverified orders will be automatically cancelled after 48 hours.

4. Delivery Timeline
Our standard delivery timeline is 14 days, which includes custom craftsmanship, frame assembly by our master artisans, and courier transit. While we strive to meet all delivery timelines, transit delays from third-party logistics agents are out of our control.`,
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
