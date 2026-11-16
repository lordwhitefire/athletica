import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'productPrice',
  title: 'Price',
  type: 'object',
  fields: [
    defineField({name: 'current', title: 'Current Price', type: 'number'}),
    defineField({name: 'original', title: 'Original Price', type: 'number'}),
    defineField({name: 'discount_percent', title: 'Discount Percent', type: 'number'}),
    defineField({name: 'member_price', title: 'Member Price', type: 'number'}),
    defineField({name: 'currency', title: 'Currency', type: 'string'}),
  ],
})
