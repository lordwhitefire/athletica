import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'colorVariant',
  title: 'Color Variant',
  type: 'object',
  fields: [
    defineField({name: 'color', title: 'Color', type: 'string'}),
    defineField({name: 'product_id', title: 'Product ID', type: 'string'}),
    defineField({name: 'thumbnail', title: 'Thumbnail', type: 'image'}),
  ],
})
