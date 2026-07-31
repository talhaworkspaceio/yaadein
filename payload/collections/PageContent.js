export const PageContent = {
  slug: 'page-content',
  labels: {
    singular: 'Page Content',
    plural: 'Pages Content & Media',
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'pageTitle',
  },
  fields: [
    {
      name: 'pageIdentifier',
      type: 'select',
      required: true,
      unique: true,
      label: 'Page Name / Route',
      options: [
        { label: 'Home Page (/)', value: 'home' },
        { label: 'Catalog (/catalog)', value: 'catalog' },
        { label: 'Customize (/customize)', value: 'customize' },
        { label: 'Contact Us (/contact)', value: 'contact' },
        { label: 'Services (/services)', value: 'services' },
        { label: 'New Arrivals (/new-arrivals)', value: 'new-arrivals' },
        { label: 'Privacy Policy (/privacy-policy)', value: 'privacy-policy' },
        { label: 'Refund Policy (/refund-policy)', value: 'refund-policy' },
        { label: 'Terms & Conditions (/terms-and-conditions)', value: 'terms-and-conditions' },
        { label: 'Track Order (/track-order)', value: 'track-order' },
      ],
    },
    {
      name: 'pageTitle',
      type: 'text',
      required: true,
      label: 'Page Admin Title',
    },
    {
      name: 'hero',
      type: 'group',
      label: 'Hero Section (Title, Subtitle & Media)',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Hero Title',
        },
        {
          name: 'subtitle',
          type: 'textarea',
          label: 'Hero Subtitle / Description',
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'Call to Action Button Label',
        },
        {
          name: 'ctaLink',
          type: 'text',
          label: 'Call to Action Button Link',
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Hero Background / Main Image',
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Editable Page Text & Media Sections',
      fields: [
        {
          name: 'sectionId',
          type: 'text',
          required: true,
          label: 'Section ID / Identifier (e.g. features, about, contact-info)',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Section Title / Heading',
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Section Subtitle',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Section Text Content / Body',
        },
        {
          name: 'sectionImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Section Image / Graphic',
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Section Button Label',
        },
        {
          name: 'buttonLink',
          type: 'text',
          label: 'Section Button Link',
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Metadata',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
        },
      ],
    },
  ],
}
