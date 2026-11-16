import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'id', title: 'ID', type: 'string'}),
    defineField({name: 'url_slug', title: 'URL Slug', type: 'slug', options: {source: 'model'}}),
    defineField({name: 'model', title: 'Model', type: 'string'}),
    defineField({name: 'brand', title: 'Brand', type: 'reference', to: [{type: 'brand'}]}),
    defineField({name: 'category', title: 'Category', type: 'string'}),
    defineField({name: 'traction', title: 'Traction', type: 'string'}),
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'gender', title: 'Gender', type: 'string'}),

    defineField({name: 'main_image', title: 'Main Image', type: 'image'}),
    defineField({
      name: 'image_gallery',
      title: 'Image Gallery',
      type: 'array',
      of: [{type: 'image'}],
    }),
    defineField({name: 'thumbnail', title: 'Thumbnail', type: 'image'}),
    defineField({name: 'color', title: 'Color', type: 'string'}),
    defineField({
      name: 'color_variants',
      title: 'Color Variants',
      type: 'array',
      of: [{type: 'colorVariant'}],
    }),
    defineField({name: 'price', title: 'Price', type: 'productPrice'}),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      of: [{type: 'productSize'}],
    }),
    defineField({name: 'description', title: 'Description', type: 'productDescription'}),
  ],
})
