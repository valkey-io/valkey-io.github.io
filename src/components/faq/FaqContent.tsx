import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { faqCategories, faqs } from '../../data/faq';

interface FaqContentProps {
  searchQuery: string;
}

export const FaqContent = ({ searchQuery }: FaqContentProps) => {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  // Filter FAQs based on search query and group by category
  const faqsByCategory = faqCategories.map(category => {
    const categoryFaqs = faqs
      .filter(faq => faq.categoryId === category.id)
      .filter(faq => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          faq.question.toLowerCase().includes(searchLower) ||
          faq.answer.toLowerCase().includes(searchLower)
        );
      });

    return {
      ...category,
      faqs: categoryFaqs
    };
  });

  // Check if we have any results
  const hasResults = faqsByCategory.some(category => category.faqs.length > 0);

  // Reset open indices when search query changes
  useEffect(() => {
    setOpenIndices([]);
  }, [searchQuery]);

  // Handle accordion changes
  const handleAccordionChange = (indices: number[]) => {
    setOpenIndices(indices);
  };

  return (
    <Box p={4}>
      {searchQuery && !hasResults ? (
        <Box borderRadius={'2px'} p={8} textAlign="center">
          <Text fontWeight="800" color="secondary.purple.500" mb={1} fontSize={{ base: "32px", md: "60px" }}>
            &lt;/&gt;
          </Text>
          <Text fontWeight="medium" color="secondary.purple.500" mb={1}>
            We couldn't find any results matching your search
          </Text>
          <Text color="secondary.purple.500">Check your spelling or try different keywords</Text>
        </Box>
      ) : (
        <Box background={'white'} borderRadius={'2px'} p={4}>
          <Heading as="h1" fontSize="20px" mb={2} color="secondary.purple.500">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'FAQ'}
          </Heading>
          <Accordion 
            index={openIndices}
            onChange={handleAccordionChange}
            allowMultiple
          >
            {faqsByCategory.map((category, categoryIndex) => (
              category.faqs.length > 0 && (
                <Box 
                  key={category.id} 
                  mb={categoryIndex < faqsByCategory.length - 1 ? 2 : 0} 
                  background={'rgba(104, 147, 255, 0.1)'} 
                  padding={'4'} 
                  paddingBottom={'2'}
                  id={`faq-category-${category.slug}`}
                >
                  <Heading as="h3" fontSize="16px" mb={1} color="secondary.purple.500">
                    {category.name}
                  </Heading>
                  {category.faqs.map((faq) => (
                    <AccordionItem 
                      key={faq.id} 
                      mb={'2'}
                      sx={{
                        '&[data-state="open"]': {
                          background: 'white',
                        }
                      }}
                    >
                      <AccordionButton 
                        background={'#E1EAFF'} 
                        borderRadius={'0'}
                        _expanded={{
                          background: '#fff',
                        }}
                        _focus={{
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        <Text fontSize="16px" flex="1" textAlign="left">
                          {faq.question}
                        </Text>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4} background={'white'} borderTop={'1px solid'} borderColor={'#EFF4FF'}>
                        <Box 
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                          sx={{
                            '& p': {
                              mb: 2,
                              '&:last-child': {
                                mb: 0
                              }
                            },
                            '& ul': {
                              mb: 2,
                              pl: 4,
                              '& li': {
                                mb: 1,
                                '&:last-child': {
                                  mb: 0
                                }
                              }
                            },
                            '& a': {
                              color: 'secondary.purple.500',
                              textDecoration: 'underline',
                              '&:hover': {
                                color: 'secondary.purple.600'
                              }
                            }
                          }}
                        />
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Box>
              )
            ))}
          </Accordion>
        </Box>
      )}
    </Box>
  );
};
