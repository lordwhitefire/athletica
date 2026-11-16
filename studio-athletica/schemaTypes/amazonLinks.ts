import { defineType, defineField } from "sanity"

export default defineType({
  name: "amazonLinks",
  title: "Amazon Links",
  type: "document",
  fields: [
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "productId", type: "string", title: "Product ID" },
            { name: "url", type: "url", title: "Amazon URL" },
          ],
          preview: {
            select: { title: "productId", subtitle: "url" },
          },
        },
      ],
    }),
  ],
})
