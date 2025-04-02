import { Box, Container, Heading } from '@chakra-ui/react';

export const CommandReferenceHeader = () => {
  return (
    <Box bgGradient="linear(to-b, #3B2A66, #4E51BF)" color="white" py={16} textAlign="center">
      <Container maxW="container.xl">
        <Heading as="h1" size="2xl" mb={4}>
          Command Reference
        </Heading>
      </Container>
    </Box>
  );
};
