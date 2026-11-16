import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'logo', title: 'Logo', type: 'image'}),
  ],
  preview: {
    select: {title: 'name', media: 'logo'},
  },
})
