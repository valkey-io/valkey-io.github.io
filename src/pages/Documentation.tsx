import { Box, Container } from '@chakra-ui/react';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DocumentationContent } from '../components/documentation/DocumentationContent';
import { DocumentationHeader } from '../components/documentation/DocumentationHeader';
import { DocumentationSearch } from '../components/documentation/DocumentationSearch';
import { DocumentationSidebar } from '../components/documentation/DocumentationSidebar';

export const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box>
      <DocumentationHeader />
      <Container maxW="100%" p={0}>
        <Box display="flex" flexDirection={{base: "column", lg: "row"}} gap={0} py={0}>
          <Box
            w={{base: "100%", lg: "420px"}}
            flex={{base: "1", lg: "0 0 420px"}}
            p={4}
            background="secondary.lavender.100"
            position={{base: 'static', lg: 'sticky'}}
            top={{base: 'auto', lg: '80px'}}
            h={{base: 'auto', lg: 'calc(100vh - 80px)'}}
          >
            <DocumentationSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <DocumentationSidebar searchQuery={searchQuery} />
          </Box>
          <Box flex={1} background={'rgba(226, 232, 240, 1)'}>
            <Routes>
              <Route path="/" element={<DocumentationContent />} />
              <Route path=":topicId" element={<DocumentationContent />} />
            </Routes>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
