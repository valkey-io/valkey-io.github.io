import { useState } from 'react';
import { FaqContent } from '../../components/faq/FaqContent';
import { FaqSearch } from '../../components/faq/FaqSearch';
import { FaqSidebar } from '../../components/faq/FaqSidebar';

import {
  Box,
  Container
} from '@chakra-ui/react';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Container maxW="100%" p={0}>
      <Box display="flex" flexDirection={{base: "column", lg: "row"}} gap={0} py={0}>
        <Box w={{base: "100%", lg: "420px"}} flex={{base: "1", lg: "0 0 420px"}} p={4} background="secondary.lavender.100"
          h={'calc(100vh - 80px)'}
          overflowX={'auto'}
        >
          <FaqSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <FaqSidebar setSearchQuery={setSearchQuery} />
        </Box>
        <Box flex={1} background={'rgba(226, 232, 240, 1)'}
          h={'calc(100vh - 80px)'}
          overflowX={'auto'}
        >
          <FaqContent searchQuery={searchQuery} />
        </Box>
      </Box>
    </Container>
  );
}
