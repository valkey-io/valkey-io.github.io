import { Box, Button, Container, Flex, Heading, Image, Link, Text, VStack } from '@chakra-ui/react';
import { Navigate, useParams } from 'react-router-dom';
import { blogDigest, blogPosts } from '../../data/blogPosts';
import { BlogPost } from '../../data/types';
import { Breadcrumbs } from '../common/Breadcrumbs';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Import all author images
const authorImages = import.meta.glob<{ default: string }>('/src/assets/media/authors/*.{jpeg,jpg,png}', { eager: true });

// Get related posts (posts with same category)
const getRelatedPosts = (category: BlogPost['category'], currentSlug: string) => {
  return blogDigest
    .filter(post => post.category === category && post.slug !== currentSlug)
    .slice(0, 3);
};

// Get blog post by slug
const getBlogPost = (slug: string): BlogPost | undefined => {
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) return undefined;

  return post;
};

// Get author image URL
const getAuthorImageUrl = (imageUrl: string) => {
  // Convert the URL path to match the glob pattern
  const imagePath = imageUrl.replace('/assets/media/authors/', '/src/assets/media/authors/');
  return authorImages[imagePath]?.default || '/assets/media/authors/default.jpg';
};

export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post || !slug) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = getRelatedPosts(post.category, slug);

  const breadcrumbItems = [
    { label: 'Blog', href: '/blog' },
    { label: post.title }
  ];

  return (
    <Container maxW="none" p={0} background={'#E9EBF8'}>
      <Breadcrumbs items={breadcrumbItems} />
      <Box display="flex" flexDirection={{base: "column", lg: "row"}} gap={0} py={0}>
        {/* Main Content */}
        <Box
          flex="1"
          background={'#E2E8F0'}
          padding={'4'}
          h={'calc(100vh - 185px)'}
          overflowX={'auto'}
        >
          <Box flex="1" background={'white'} padding={'4'}>
            <Image
              src={post.imageUrl}
              alt={post.title}
              width="100%"
              height="400px"
              objectFit="cover"
              borderRadius="lg"
              mb={2}
            />

            <Heading as="h1" fontSize="28px" fontWeight="bold" mb={0} color={'secondary.purple.500'}>
              {post.title}
            </Heading>

            <Text color="gray.500" mb={8}>
              {formatDate(post.date)}
            </Text>

            <Box
              className="blog-content"
              sx={{
                'h2': {
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginTop: '24px',
                  marginBottom: '16px',
                  color: 'secondary.purple.500'
                },
                'h3': {
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginTop: '24px',
                  marginBottom: '16px',
                  color: 'secondary.purple.500'
                },
                'h4': {
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '24px',
                  marginBottom: '16px',
                  color: 'secondary.purple.500'
                },
                'p': {
                  marginBottom: '16px',
                  lineHeight: '1.6'
                },
                'ul, ol': {
                  marginBottom: '16px',
                  paddingLeft: '24px'
                },
                'li': {
                  marginBottom: '8px'
                },
                'img': {
                  width: '100%',
                  height: 'auto',
                  maxWidth: '600px',
                  marginBottom: '8px'
                },
                'pre': {
                  background: '#2b303b',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  marginBottom: '16px'
                }
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </Box>
        </Box>

        {/* Sidebar */}
        <Box w={{base: "100%", lg: "33%"}} h={'calc(100vh - 185px)'} overflowX={'auto'} backgroundColor={'#F2F0FA'} p={4}>
          {/* Author Section */}
          <Box mb={8}>
            <Text color="purple.700" fontWeight="semibold" mb={4}>
              ABOUT THE {post.authors.length > 1 ? 'AUTHORS' : 'AUTHOR'}
            </Text>

            <VStack spacing={6} align="stretch">
              {post.authors.map((author, index) => (
                <Flex 
                  key={author.username} 
                  gap={2} 
                  pb={4} 
                  borderBottom={index !== post.authors.length - 1 ? '1px solid rgba(0,0,0,5%)' : 'none'}
                >
                  <Image
                    src={getAuthorImageUrl(author.imageUrl)}
                    alt={author.name}
                    objectFit="cover"
                    w={'60px'}
                    h={'60px'}
                    flex={'0 0 auto'}
                  />
                  <Box>
                    <Text fontSize="16px">{author.name}</Text>
                    <Link 
                      href={`https://github.com/${author.githubUser || author.username}`}
                      color="secondary.purple.500"
                      isExternal
                    >
                      @{author.username}
                    </Link>
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      {author.bio}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>

          {/* Related Posts Section */}
          <Box>
            <Text color="purple.700" fontWeight="semibold" mb={2}>
              RELATED
            </Text>
            <VStack align="stretch" spacing={4}>
              {relatedPosts.map(relatedPost => (
                <Flex key={relatedPost.slug} background="white" borderRadius="lg" overflow="hidden">
                  <Image
                    src={relatedPost.imageUrl}
                    alt={relatedPost.title}
                    height="auto"
                    width="50%"
                    objectFit="cover"
                    fallbackSrc="/src/assets/media/blog/default.webp"
                  />
                  <Box p={4}>
                    <Text fontSize="lg" fontWeight="bold" mb={2} noOfLines={2}>
                      {relatedPost.title}
                    </Text>
                    <Text color="gray.600" fontSize="sm" mb={4} noOfLines={2}>
                      {relatedPost.excerpt}
                    </Text>

                    <Link href={`/blog/${relatedPost.slug}`} _hover={{ textDecoration: 'none' }}>
                      <Button
                        variant="outline"
                        borderWidth={'1px'}
                        size="md"
                        borderRadius={'50px'}
                        alignSelf={'flex-end'}
                        marginLeft={'auto'}
                        _hover={{
                          borderColor: '#072150',
                          color: 'white',
                          background: '#072150',
                        }}
                      >
                        Read More
                      </Button>
                    </Link>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
