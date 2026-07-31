export const ServicesPage = {
  slug: 'services-page',
  label: 'Services Page Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Our Bespoke Services',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Page Subtitle / Tagline',
      defaultValue: 'From museum-grade matting to custom wood carving and archival glass options.',
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Services Header Banner Image',
    },
    {
      name: 'ctaTitle',
      type: 'text',
      label: 'Call to Action Title',
      defaultValue: 'Ready to Custom Frame Your Art?',
    },
    {
      name: 'ctaButtonText',
      type: 'text',
      label: 'Call to Action Button Label',
      defaultValue: 'CUSTOMIZE NOW',
    },
  ],
}
