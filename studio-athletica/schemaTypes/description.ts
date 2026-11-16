import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'productDescription',
  title: 'Description',
  type: 'object',
  fields: [
    defineField({name: 'subtitle', title: 'Subtitle', type: 'string'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'text'}),
    defineField({name: 'intro', title: 'Intro', type: 'text'}),
    defineField({name: 'collection', title: 'Collection', type: 'string'}),
    defineField({
      name: 'key_benefits',
      title: 'Key Benefits',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'technical_details',
      title: 'Technical Details',
      type: 'technicalDetails',
    }),
  ],
})
