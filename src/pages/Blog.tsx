import { Box, Container } from '@chakra-ui/react';
import { useState } from 'react';
import { BlogContent } from '../components/blog/BlogContent';
import { BlogPost } from '../data/types';

import { BlogHeader } from '../components/blog/BlogHeader';
import { BlogSearch } from '../components/blog/BlogSearch';
import { BlogSidebar } from '../components/blog/BlogSidebar';

export const Blog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlogPost['category'] | ''>('');
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <Box>
      <BlogHeader />
      <Container maxW="100%" p={0}>
        <Box display="flex" flexDirection={{base: "column", lg: "row"}} gap={0} py={0}>
          <Box w={{base: "100%", lg: "420px"}} flex={{base: "1", lg: "0 0 420px"}} p={4} background="secondary.lavender.100">
            <BlogSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
            <BlogSidebar />
          </Box>
          <Box flex={1} background={'rgba(226, 232, 240, 1)'}>
            <BlogContent
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedDate={selectedDate}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
