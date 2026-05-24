// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Valkey',
      social: [
        {
          label: 'GitHub',
          href: 'https://github.com/valkey-io/valkey',
          icon: 'github',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Example Guide', slug: 'guides/example' },
          ],
        },
        {
          label: 'Blog Posts',
          items: [
            { autogenerate: { directory: 'blog' } },
          ],
        },
        {
          label: 'Documentation Topics',
          items: [
            { autogenerate: { directory: 'topics' } },
          ],
        },
        {
          label: 'Valkey Commands',
          items: [
            { autogenerate: { directory: 'reference' } },
          ],
        },
      ],
    }),
    react(),
  ],
});