export const Navigation = {
  slug: 'navigation',
  label: 'Header & Footer Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'header',
      type: 'group',
      label: 'Header Settings',
      fields: [
        {
          name: 'logoText',
          type: 'text',
          label: 'Brand Logo Text',
          defaultValue: 'YAADEIN',
        },
        {
          name: 'logoImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Brand Logo Image (Optional)',
        },
      ],
    },
    {
      name: 'footerBrand',
      type: 'group',
      label: 'Footer Brand & About',
      fields: [
        {
          name: 'tagline',
          type: 'textarea',
          label: 'Footer About / Tagline Text',
          defaultValue: 'Masterpiece picture framing handcrafted for your unique memories. Designed digitally by you, hand-finished by master craftspeople in Pakistan.',
        },
        {
          name: 'footerLogo',
          type: 'upload',
          relationTo: 'media',
          label: 'Footer Logo Image (Optional)',
        },
      ],
    },
    {
      name: 'studioInfo',
      type: 'group',
      label: 'Footer Studio Info Column',
      fields: [
        {
          name: 'workingHours',
          type: 'text',
          label: 'Working Hours Text',
          defaultValue: 'Mon - Fri: 9:00 AM - 6:00 PM',
        },
        {
          name: 'supportEmail',
          type: 'text',
          label: 'Support Email Address',
          defaultValue: 'team@yaadein.com',
        },
        {
          name: 'locationText',
          type: 'text',
          label: 'Location / Country Text',
          defaultValue: 'Designed in Pakistan',
        },
        {
          name: 'developerLinkText',
          type: 'text',
          label: 'Developer Link Label',
          defaultValue: 'Developer LinkedIn',
        },
        {
          name: 'developerLinkUrl',
          type: 'text',
          label: 'Developer Link URL',
          defaultValue: 'https://www.linkedin.com/in/talharshad/',
        },
      ],
    },
    {
      name: 'footerBottom',
      type: 'group',
      label: 'Footer Bottom Bar',
      fields: [
        {
          name: 'copyrightText',
          type: 'text',
          label: 'Copyright Text',
          defaultValue: '© 2026 Yaadein. All rights reserved.',
        },
        {
          name: 'craftedText',
          type: 'text',
          label: 'Crafted Tagline Text',
          defaultValue: 'Crafted with ♥ for timeless memories.',
        },
      ],
    },
  ],
}
