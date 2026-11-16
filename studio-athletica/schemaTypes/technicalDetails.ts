import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'technicalDetails',
  title: 'Technical Details',
  type: 'object',
  fields: [
    defineField({name: 'range', title: 'Range', type: 'string'}),
    defineField({name: 'sole_type', title: 'Sole Type', type: 'string'}),
    defineField({name: 'upper_material', title: 'Upper Material', type: 'string'}),
    defineField({name: 'adjustment', title: 'Adjustment', type: 'string'}),
  ],
})
