import { Box, Flex, Link, Text } from '@chakra-ui/react';
import { blogDigest } from '../../data/blogPosts';
import { BlogPost } from '../../data/types';

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface BlogContentProps {
  searchQuery: string;
  selectedCategory: BlogPost['category'] | '';
  selectedDate: string;
}

export const BlogContent = ({ searchQuery, selectedCategory, selectedDate }: BlogContentProps) => {
  const filteredPosts = blogDigest.filter(post => {
    // Handle search query
    const searchLower = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (post.title || '').toLowerCase().includes(searchLower) ||
      (post.excerpt || '').toLowerCase().includes(searchLower) ||
      (post.date || '').toLowerCase().includes(searchLower);

    // Handle category filter
    const matchesCategory = !selectedCategory || post.category === selectedCategory;

    // Handle date filter
    const postDate = post.date ? new Date(post.date).toISOString().split('T')[0] : '';
    const matchesDate = !selectedDate || postDate === selectedDate;

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <Box p={4}>
      {(searchQuery || selectedCategory || selectedDate) && filteredPosts.length === 0 ? (
        <Box borderRadius={'2px'} p={8} textAlign="center">
          <Text fontWeight="800" color="secondary.purple.500" mb={1} fontSize={{ base: "32px", md: "60px" }} >
            &lt;/&gt;
          </Text>
          <Text fontWeight="medium" color="secondary.purple.500" mb={1}>
            We couldn't find any blog posts matching your criteria
          </Text>
          <Text color="secondary.purple.500">Try adjusting your filters or search terms</Text>
        </Box>
      ) : (
        <>
          <Box>
            {filteredPosts.map((post, index) => (
              <Box
                key={post.slug}
                mb={index < filteredPosts.length - 1 ? 4 : 0}
                background={'white'}
                borderRadius={'2px'}
                overflow="hidden"
              >
                <Flex>
                  <Box p={4} flex="1">
                    <Link href={`/blog/${post.slug}`}>
                      <Text fontSize="1xl" fontWeight="bold" color="secondary.purple.500" mb={0}>
                        {post.title}
                      </Text>
                    </Link>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {formatDate(post.date)}
                    </Text>
                    <Text mb={4}>{post.excerpt}</Text>
                    <Link
                      href={`/blog/${post.slug}`}
                      color="primary.500"
                      fontWeight="medium"
                      textDecor={'underline'}
                    >
                      Read More
                    </Link>
                  </Box>
                </Flex>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};
