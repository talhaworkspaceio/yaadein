export const TrackPage = {
  slug: 'track-page',
  label: 'Track Order Page Content',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      defaultValue: 'Track Your Order',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Page Subtitle / Instructions',
      defaultValue: 'Enter your order tracking number or email address below to view live order progress and delivery updates.',
    },
    {
      name: 'inputPlaceholder',
      type: 'text',
      label: 'Order ID Field Placeholder',
      defaultValue: 'e.g. YDN-109284',
    },
    {
      name: 'buttonText',
      type: 'text',
      label: 'Track Button Label',
      defaultValue: 'TRACK ORDER',
    },
  ],
}
