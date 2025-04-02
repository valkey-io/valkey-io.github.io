import { Box, Container, Heading, Link, Text } from '@chakra-ui/react';

export const DocumentationHeader = () => {
  return (
    <Box bgGradient="linear(to-b, #3B2A66, #4E51BF)" color="white" py={16} textAlign="center">
      <Container maxW="container.xl">
        <Heading as="h1" size="2xl" mb={4}>
          Documentation
        </Heading>
        <Text fontSize="lg">
          The Valkey documentation is managed in markdown files in the{' '}
          <Link href="https://github.com/valkey-io/valkey-doc" color="white" textDecoration="underline">
            valkey-doc repository
          </Link>
          . It is released under the{' '}
          <Link href="https://creativecommons.org/licenses/by-sa/4.0/" color="white" textDecoration="underline">
            Creative Commons Attribution-ShareAlike 4.0 International license
          </Link>
          .
        </Text>
      </Container>
    </Box>
  );
};
