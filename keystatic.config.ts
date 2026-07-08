import { config, collection, singleton, fields } from '@keystatic/core';

// Keystatic CMS config. This file is imported by the browser-side admin UI,
// so only statically-replaced import.meta.env values may be referenced here
// (process.env would throw in the browser).
//
// GitHub mode: edits authenticate through the korikosmos.dev GitHub App and
// land as commits on the repo (in dev too). Credentials come from
// KEYSTATIC_GITHUB_CLIENT_ID / KEYSTATIC_GITHUB_CLIENT_SECRET /
// KEYSTATIC_SECRET (+ PUBLIC_KEYSTATIC_GITHUB_APP_SLUG for the client) — see
// README "Content editing". Visiting /keystatic in dev without credentials
// triggers Keystatic's GitHub App creation flow, which writes them to .env.
// For offline work, temporarily switch storage to { kind: 'local' }.

export default config({
  storage: { kind: 'github', repo: 'KoriKosmos/korikosmos.dev' },

  collections: {
    blog: collection({
      label: 'Blog',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Description', validation: { isRequired: true } }),
        pubDate: fields.date({ label: 'Publish date', validation: { isRequired: true } }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
      },
    }),

    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        summary: fields.text({ label: 'Summary', validation: { isRequired: true } }),
        description: fields.text({ label: 'Description', multiline: true, validation: { isRequired: true } }),
        github: fields.url({ label: 'GitHub URL' }),
        content: fields.markdoc({ label: 'Content', extension: 'md' }),
      },
    }),
  },

  singletons: {
    cv: singleton({
      label: 'CV',
      path: 'src/data/cv',
      format: { data: 'json' },
      schema: {
        personal: fields.object(
          {
            name: fields.text({ label: 'Name' }),
            title: fields.text({ label: 'Title' }),
            location: fields.text({ label: 'Location' }),
            email: fields.text({ label: 'Email' }),
            website: fields.url({ label: 'Website' }),
            linkedin: fields.url({ label: 'LinkedIn' }),
          },
          { label: 'Personal info' },
        ),
        sections: fields.array(
          fields.object({
            title: fields.text({ label: 'Title' }),
            content: fields.array(fields.text({ label: 'Paragraph', multiline: true }), {
              label: 'Content paragraphs',
            }),
            items: fields.array(
              fields.object({
                main: fields.text({ label: 'Main text' }),
                description: fields.text({ label: 'Description', multiline: true }),
                subItems: fields.array(fields.text({ label: 'Sub item' }), { label: 'Sub items' }),
              }),
              {
                label: 'Items',
                itemLabel: props => props.fields.main.value || 'Item',
              },
            ),
          }),
          {
            label: 'Sections',
            itemLabel: props => props.fields.title.value || 'Section',
          },
        ),
      },
    }),
  },
});
