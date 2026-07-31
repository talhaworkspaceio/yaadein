export const ContactPage = {
  slug: 'contact-page',
  label: 'Contact Page Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Contact Our Master Artisans',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Page Subtitle / Tagline',
      defaultValue: 'Have a question about a custom order, specific sizing, or volume commissions? Reach out to us anytime.',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone / WhatsApp Number',
      defaultValue: '+92 300 1234567',
    },
    {
      name: 'email',
      type: 'text',
      label: 'Support Email Address',
      defaultValue: 'support@yaadein.pk',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Studio Studio / Workshop Address',
      defaultValue: 'Studio 14, Artisan Quarter, Main Boulevard, Lahore, Pakistan',
    },
    {
      name: 'workingHours',
      type: 'text',
      label: 'Working Hours Text',
      defaultValue: 'Monday - Saturday: 10:00 AM - 8:00 PM PKT',
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Contact Header Banner Image',
    },
  ],
}
