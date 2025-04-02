import { Alert, AlertIcon, Box, Container, Flex, Spinner } from '@chakra-ui/react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import {
  StyledH1,
  StyledH2,
  StyledLink,
  StyledList,
  StyledListItem,
  StyledParagraph
} from '../../components/common/MarkdownComponents';
import { useCodeOfConduct } from '../../hooks/useCodeOfConduct';
import SbHero from '/src/assets/images/code-of-conduct-image.webp';

export default function CodeOfConduct() {
  const breadcrumbItems = [
    { label: 'Community', href: '/community' },
    { label: 'Code of Conduct' }
  ];

  const { content, isLoading, error } = useCodeOfConduct();

  const components: Components = {
    h1: StyledH1,
    h2: StyledH2,
    p: StyledParagraph,
    ul: StyledList,
    li: StyledListItem,
    a: StyledLink
  };

  return (
    <Container maxW="none" p={0} background={'#E9EBF8'}>
      <Breadcrumbs items={breadcrumbItems} />

      <Flex 
        gap={0} 
        minH={'100%'} 
        direction={{ base: 'column-reverse', md: 'row' }}
      >
        {/* Main Content */}
        <Box
          flex="1"
          background={'#E2E8F0'}
          padding={'4'}
          h={'calc(100vh - 120px)'}
          overflowX={'auto'}
        >
          <Box flex="1" background={'white'} padding={'6'}>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="secondary.purple.500" />
              </Flex>
            ) : error ? (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            ) : (
              <ReactMarkdown components={components}>
                {content}
              </ReactMarkdown>
            )}
          </Box>
        </Box>

        {/* Sidebar */}
        <Box 
          w={{ base: '100%', md: '33%' }}
          h={{ base: '250px', md: 'calc(100vh - 120px)' }}
          overflowX={'auto'} 
          backgroundColor={'#F2F0FA'}
          backgroundImage={SbHero}
          backgroundSize={'cover'}
          backgroundPosition={'center bottom'}
          p={4}>          
        </Box>
      </Flex>
    </Container>
  );
}
