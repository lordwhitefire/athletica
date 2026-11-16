import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'site_logo', title: 'Site Logo', type: 'image'}),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        {
          name: 'brand_name',
          title: 'Brand Name',
          type: 'string',
          validation: (Rule) => Rule.max(30),
        },
        {
          name: 'brand_description',
          title: 'Brand Description',
          type: 'string',
          validation: (Rule) => Rule.max(200),
        },
        {
          name: 'social_links',
          title: 'Social Links',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              {name: 'label', type: 'string', title: 'Label'},
              {name: 'url', type: 'string', title: 'URL'},
              {name: 'icon', type: 'string', title: 'Material Icon Name'},
            ],
          }],
        },
        {
          name: 'link_columns',
          title: 'Link Columns',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              {name: 'title', type: 'string', title: 'Column Title'},
              {
                name: 'links',
                title: 'Links',
                type: 'array',
                of: [{
                  type: 'object',
                  fields: [
                    {name: 'label', type: 'string', title: 'Label'},
                    {name: 'href', type: 'string', title: 'URL'},
                  ],
                }],
                validation: (Rule) => Rule.max(4),
              },
            ],
          }],
        },
        {
          name: 'copyright',
          title: 'Copyright Text',
          type: 'string',
          validation: (Rule) => Rule.max(100),
        },
        {
          name: 'bottom_tags',
          title: 'Bottom Tags',
          type: 'array',
          of: [{type: 'string'}],
          validation: (Rule) => Rule.max(6),
        },
      ],
    }),
  ],
})
