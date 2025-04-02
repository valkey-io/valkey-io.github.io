import { Box, Text, VStack } from '@chakra-ui/react';
import { faqCategories } from '../../data/faq';

interface FaqSidebarProps {
  setSearchQuery: (query: string) => void;
}

export const FaqSidebar = ({ setSearchQuery }: FaqSidebarProps) => {
  const scrollToCategory = (slug: string) => {
    const element = document.getElementById(`faq-category-${slug}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (slug: string) => {
    setSearchQuery(''); // Clear the search
    scrollToCategory(slug); // Then scroll to category
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Text color={'secondary.purple.500'} mb={2}>
          Browse by category
        </Text>
        <Box mb={1}>
          <Text color="purple.700" fontWeight="semibold" mb={2}>
            CATEGORIES
          </Text>
        </Box>

        <VStack align="stretch">
          {faqCategories.map(category => (
            <Box
              key={category.id}
              as="button"
              onClick={() => handleCategoryClick(category.slug)}
              p={2}
              background={'primary.100'}
              _hover={{ bg: 'primary.200' }}
              cursor="pointer"
              textAlign="left"
              borderRadius={'0'}
            >
              <Text fontWeight="medium">{category.name}</Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};
