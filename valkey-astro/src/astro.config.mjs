// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel'; // Ensure this is imported

export default defineConfig({
  adapter: vercel(), // Keep the Vercel adapter
  integrations: [
    starlight({
      title: 'Valkey',
      logo: {
        alt: 'Valkey Logo',
        src: './src/assets/logo.svg',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/valkey-io/valkey',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Guides', items: [{ label: 'Example Guide', slug: 'guides/example' }] },
        { label: 'Blog Posts', autogenerate: { directory: 'blog' } },
        { label: 'Documentation Topics', autogenerate: { directory: 'topics' } },
        { label: 'Valkey Commands', autogenerate: { directory: 'reference' } },
      ],
    }),
    react(),
  ],
});