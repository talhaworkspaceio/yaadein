export const Pages = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Page Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Page Slug / URL Path (e.g. about-us, faq, story)',
      admin: {
        description: 'This defines the page URL path (e.g., /pages/about-us)',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Page Builder Sections / Blocks',
      blocks: [
        {
          slug: 'heroBlock',
          labels: {
            singular: 'Hero Banner Section',
            plural: 'Hero Banners',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Hero Heading',
            },
            {
              name: 'subheading',
              type: 'textarea',
              label: 'Hero Subheading / Tagline',
            },
            {
              name: 'bgImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Background Banner Image',
            },
            {
              name: 'ctaText',
              type: 'text',
              label: 'Button Label (Optional)',
            },
            {
              name: 'ctaLink',
              type: 'text',
              label: 'Button URL Link (Optional)',
            },
          ],
        },
        {
          slug: 'textMediaBlock',
          labels: {
            singular: 'Text & Media Split Section',
            plural: 'Text & Media Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Section Heading',
            },
            {
              name: 'content',
              type: 'textarea',
              label: 'Section Body Content',
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Section Image',
            },
            {
              name: 'imagePosition',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Image on Right', value: 'right' },
                { label: 'Image on Left', value: 'left' },
              ],
            },
          ],
        },
        {
          slug: 'contentBlock',
          labels: {
            singular: 'Full Width Rich Content Section',
            plural: 'Full Width Content Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Section Heading',
            },
            {
              name: 'body',
              type: 'textarea',
              label: 'Body Content Text',
            },
          ],
        },
        {
          slug: 'featuresGridBlock',
          labels: {
            singular: 'Features / Highlights Grid',
            plural: 'Feature Grids',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Grid Section Heading',
            },
            {
              name: 'features',
              type: 'array',
              label: 'Feature Cards',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Feature Title',
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Feature Description',
                },
                {
                  name: 'icon',
                  type: 'text',
                  label: 'Icon Emoji or Symbol (e.g. ✦, 🎨, 🚚)',
                },
              ],
            },
          ],
        },
        {
          slug: 'ctaBlock',
          labels: {
            singular: 'Call to Action Banner',
            plural: 'CTA Banners',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'CTA Heading',
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'CTA Description',
            },
            {
              name: 'buttonText',
              type: 'text',
              label: 'Button Text',
            },
            {
              name: 'buttonLink',
              type: 'text',
              label: 'Button Target URL',
            },
          ],
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
