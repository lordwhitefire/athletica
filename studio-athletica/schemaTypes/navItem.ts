import { defineType, defineField } from "sanity"

export default defineType({
  name: "navItem",
  title: "Nav Item",
  type: "object",
  fields: [
    { name: "id", type: "string", title: "ID" },
    { name: "level", type: "number", title: "Level" },
    { name: "label", type: "string", title: "Label" },
    { name: "description", type: "text", title: "Description", rows: 3 },
    { name: "href", type: "string", title: "Href" },
    { name: "disabled", type: "boolean", title: "Disabled" },
    { name: "slug", type: "string", title: "Slug" },
    { name: "featuredImage", type: "image", title: "Featured Image" },
    {
      name: "customLinks",
      title: "Custom Links",
      type: "array",
      of: [{ type: "navLink" }],
    },
    {
      name: "sizeLinks",
      title: "Size Links",
      type: "array",
      of: [{ type: "navLink" }],
    },
    {
      name: "bottomLinks",
      title: "Bottom Links",
      type: "array",
      of: [{ type: "navLink" }],
    },
    {
      name: "children",
      title: "Children",
      type: "array",
      of: [{ type: "navItem" }],
    },
  ],
  preview: {
    select: { title: "label", subtitle: "href" },
  },
})
