export const CatalogPage = {
  slug: 'catalog-page',
  label: 'Catalog Page Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Frame Catalog',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Page Subtitle / Tagline',
      defaultValue: 'Explore our handcrafted collection of bespoke frames. Filter by collection or style.',
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Catalog Header Banner Image',
    },
    {
      name: 'filterHeading',
      type: 'text',
      label: 'Filter Section Label',
      defaultValue: 'CATEGORIES',
    },
  ],
}
