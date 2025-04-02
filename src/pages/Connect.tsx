import { Alert, AlertIcon, Box, Container, Flex, Heading, Spinner, VStack } from '@chakra-ui/react';
import ReactMarkdown, { Components } from 'react-markdown';
import {
    StyledH1,
    StyledH2,
    StyledLink,
    StyledList,
    StyledListItem,
    StyledParagraph
} from '../components/common/MarkdownComponents';
import { useConnect } from '../hooks/useConnect';

export const Connect = () => {
  const { content, isLoading, error } = useConnect();

  const components: Components = {
    h1: StyledH1,
    h2: StyledH2,
    p: StyledParagraph,
    ul: StyledList,
    li: StyledListItem,
    a: StyledLink
  };

  return (
    <>
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
        <>
          <Box bgGradient="linear(to-b, #3B2A66, #4E51BF)" color="white" py={16} textAlign="center">
            <Container maxW="container.xl">
              <Heading as="h1" size="2xl" mb={4}>
                Connect
              </Heading>
            </Container>
          </Box>
          <Container maxW="container.lg" py={8}>
            <VStack spacing={6} align="stretch">
              <Box>
                <ReactMarkdown components={components}>
                  {content}
                </ReactMarkdown>
              </Box>
            </VStack>
          </Container>
        </>
      )}
    </>
  );
}; 