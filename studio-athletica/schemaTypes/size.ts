import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'productSize',
  title: 'Size',
  type: 'object',
  fields: [
    defineField({name: 'size', title: 'Size', type: 'string'}),
    defineField({name: 'available', title: 'Available', type: 'boolean'}),
    defineField({name: 'stock', title: 'Stock', type: 'number'}),
  ],
})
