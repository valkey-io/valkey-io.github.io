import { Box, Button, Flex, Image, Link, Text, VStack } from '@chakra-ui/react';
import { blogDigest } from '../../data/blogPosts';

// Get only trending posts
const trendingPosts = blogDigest.filter(post => post.trending);

export const BlogSidebar = () => {
  return (
    <VStack align="stretch" mt={'6'}>
      <Text color="purple.700" fontWeight="semibold" mb={0}>
        TRENDING
      </Text>

      <VStack align="stretch" spacing={6}>
        <VStack align="stretch" spacing={4}>
          {trendingPosts.map(post => (
            <Flex key={post.slug} background="white" borderRadius="lg" overflow="hidden">
              <Image
                src={post.imageUrl}
                alt={post.title}
                height="auto"
                width="50%"
                objectFit="cover"
                fallbackSrc="/assets/media/blog/default.webp"
              />
              <Box p={4}>
                <Text fontSize="lg" fontWeight="bold" mb={2} noOfLines={2}>
                  {post.title}
                </Text>
                <Text color="gray.600" fontSize="sm" mb={4} noOfLines={2}>
                  {post.excerpt}
                </Text>
                <Link href={`/blog/${post.slug}`} _hover={{ textDecoration: 'none' }}>
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
      </VStack>
    </VStack>
  );
};
