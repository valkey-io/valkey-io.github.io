export interface CommunityCard {
  title: string;
  description: string;
  buttonText: string;
  link: string;
}

export const communityCards: CommunityCard[] = [
  {
    title: 'Discussion Forum',
    description: 'Join our community discussions to share ideas and get help.',
    buttonText: 'Join the conversation',
    link: '/community/forum'
  },
  {
    title: 'FAQ',
    description: 'Find answers to commonly asked questions about Valkey.',
    buttonText: 'Consult FAQ',
    link: '/community/faq'
  },
  {
    title: 'Code of Conduct',
    description: 'Learn about our community guidelines and expectations.',
    buttonText: 'Read More',
    link: '/community/code-of-conduct'
  }
]; 