import { Box, Text, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { categories } from '../../data/topics';

interface DocumentationSidebarProps {
  searchQuery: string;
}

export const DocumentationSidebar = ({ searchQuery }: DocumentationSidebarProps) => {
  const { topicId } = useParams();

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories.map(category => ({
      ...category,
      items: category.items.filter(
        item =>
          item.topicName.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    })).filter(category => category.items.length > 0);
  }, [searchQuery]);

  if (filteredCategories.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Text fontWeight="800" color="secondary.purple.500" mb={1} fontSize={{ base: "32px", md: "60px" }}>
          &lt;/&gt;
        </Text>
        <Text fontWeight="medium" color="secondary.purple.500" mb={1}>
          We couldn't find any results matching your search
        </Text>
        <Text color="secondary.purple.500">Check your spelling or try different keywords</Text>
      </Box>
    );
  }

  return (
    <VStack
      align="stretch" 
      spacing={6}
      h={{base: 'auto', md: 'calc(100vh - 158px)'}}
      overflowX={{base: 'visible', md: 'auto'}}
    >
      <Box>
        <Text color={'secondary.purple.500'} mb={2}>
          Browse by task
        </Text>
        {filteredCategories.map(section => (
          <Box key={section.title} mb={4}>
            <Text color="purple.700" fontWeight="semibold" mb={2}>
              {section.title}
            </Text>
            <VStack align="stretch">
              {section.items.map(item => (
                <RouterLink
                  key={item.id}
                  to={`/topics/${item.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Box
                    p={2}
                    background={topicId === item.id ? 'primary.200' : 'primary.100'}
                    _hover={{ bg: 'primary.200' }}
                  >
                    <Text fontWeight="medium">{item.topicName}</Text>
                    <Text fontSize="sm">{item.description}</Text>
                  </Box>
                </RouterLink>
              ))}
            </VStack>
          </Box>
        ))}
      </Box>
    </VStack>
  );
};
