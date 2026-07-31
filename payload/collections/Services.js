export const ServicesCollection = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'priceInfo', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Service Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Service Slug (URL Identifier, e.g. instagram-mirror-selfie, nikkahnama-framing)',
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Tagline / Subheading',
    },
    {
      name: 'shortDesc',
      type: 'textarea',
      label: 'Short Description (shown on main Services page cards)',
    },
    {
      name: 'detailedText',
      type: 'textarea',
      label: 'Detailed Description / Full Text (shown on inner service page)',
    },
    {
      name: 'priceInfo',
      type: 'text',
      label: 'Price Info (e.g. Starting from Rs. 4,999)',
    },
    {
      name: 'mainImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Service Main Image Upload (Optional)',
    },
    {
      name: 'imageUrl',
      type: 'text',
      label: 'Service Image Static Path / URL Fallback (e.g. /images/instagram_mirror_selfie.jpg)',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Key Features / Bullet Points',
      fields: [
        {
          name: 'featureText',
          type: 'text',
          label: 'Feature Description Bullet',
        },
      ],
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'Button Action Label (e.g. Upload & Frame, Add to Cart)',
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'Button Action URL Link',
    },
  ],
}
