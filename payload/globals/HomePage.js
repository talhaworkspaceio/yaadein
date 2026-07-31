export const HomePage = {
  slug: 'home-page',
  label: 'Home Page Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: '1. Hero Section',
      fields: [
        {
          name: 'titleLine1',
          type: 'text',
          label: 'Title Line 1',
          defaultValue: 'Turn Your',
        },
        {
          name: 'titleLine2',
          type: 'text',
          label: 'Title Line 2',
          defaultValue: 'Moments Into',
        },
        {
          name: 'titleHighlight',
          type: 'text',
          label: 'Title Highlighted Text (Gold)',
          defaultValue: 'Museum Art',
        },
        {
          name: 'subtitle',
          type: 'textarea',
          label: 'Hero Description / Subtitle',
          defaultValue: 'Experience bespoke picture framing handcrafted for your specific style. Customize details in real-time, and let our master artisans deliver it ready to hang.',
        },
        {
          name: 'backgroundVideo',
          type: 'upload',
          relationTo: 'media',
          label: 'Background Video / Media File',
        },
        {
          name: 'backgroundVideoUrl',
          type: 'text',
          label: 'Or Video URL (e.g. /videos/yaadein.mp4 or MP4 link)',
          defaultValue: '/videos/yaadein.mp4',
        },
      ],
    },
    {
      name: 'featuredProducts',
      type: 'group',
      label: '2. Featured Products Section',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section Title',
          defaultValue: 'Featured Products',
        },
        {
          name: 'subtitle',
          type: 'textarea',
          label: 'Section Subtitle',
          defaultValue: 'Choose from our bespoke frame profiles. Select a style to launch it instantly in our interactive studio builder.',
        },
      ],
    },
    {
      name: 'memoriesSection',
      type: 'group',
      label: "3. Memories & Nature's Light Section",
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section Heading',
          defaultValue: "Where Memories Meet Nature's Light",
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Section Body Text',
          defaultValue: 'Every photograph is a story of shadows and highlights. Our bespoke frames are built to interact harmoniously with the ambient atmosphere. Watch as natural daylight from a nearby window shifts across the real-wood textures and museum matting, breathing organic life into your timeless moments.',
        },
        {
          name: 'browseButtonText',
          type: 'text',
          label: 'Primary Button Label',
          defaultValue: 'BROWSE CATALOGUE',
        },
        {
          name: 'browseButtonLink',
          type: 'text',
          label: 'Primary Button Link',
          defaultValue: '/catalog',
        },
        {
          name: 'lightSwitchText',
          type: 'text',
          label: 'Light Switch Label',
          defaultValue: 'LIGHT SWITCH',
        },
        {
          name: 'sectionImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Section Display Image',
        },
      ],
    },
    {
      name: 'writtenInTimeSection',
      type: 'group',
      label: '4. Written in Time Section (Pen Graphic)',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Eyebrow Tag',
          defaultValue: 'PRESERVING MEMORIES',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Cursive Section Title',
          defaultValue: 'Written in Time',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Section Description Text',
          defaultValue: 'Every frame we build, every photo we restore, is a testament to the moments that define us. Using traditional techniques and premium materials, we craft heirlooms that bridge generations. Let us help you write your story in wood and glass.',
        },
        {
          name: 'signature',
          type: 'text',
          label: 'Cursive Signature',
          defaultValue: 'Yaadein Art Studio',
        },
      ],
    },
    {
      name: 'servicesSection',
      type: 'group',
      label: '5. Services Overview Section',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Eyebrow Tag',
          defaultValue: 'OUR SERVICES',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Main Heading',
          defaultValue: 'Crafted With Care, Delivered With Pride',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Sub-heading / Description',
          defaultValue: 'From the first cut of wood to the final placement on your wall, every step is handled by our in-house artisans. Whatever your framing need, we bring museum-grade craftsmanship to your doorstep.',
        },
        {
          name: 'feature1Title',
          type: 'text',
          label: 'Service 1 Title',
          defaultValue: 'Old Photo Restoration',
        },
        {
          name: 'feature1Desc',
          type: 'textarea',
          label: 'Service 1 Description',
          defaultValue: 'Bring damaged, faded, or torn family photographs back to life with professional digital repair and colorization.',
        },
        {
          name: 'feature2Title',
          type: 'text',
          label: 'Service 2 Title',
          defaultValue: 'Nikkahnama Frame',
        },
        {
          name: 'feature2Desc',
          type: 'textarea',
          label: 'Service 2 Description',
          defaultValue: 'Elegant custom-built frames designed specifically to preserve and display your Nikkahnama with timeless grace.',
        },
        {
          name: 'feature3Title',
          type: 'text',
          label: 'Service 3 Title',
          defaultValue: 'Board Games',
        },
        {
          name: 'feature3Desc',
          type: 'textarea',
          label: 'Service 3 Description',
          defaultValue: 'Handcrafted luxury wooden board games — from Ludo to Chess — built for family fun and aesthetic value.',
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Button Label',
          defaultValue: 'EXPLORE SERVICES',
        },
        {
          name: 'buttonLink',
          type: 'text',
          label: 'Button Link',
          defaultValue: '/services',
        },
      ],
    },
  ],
}
