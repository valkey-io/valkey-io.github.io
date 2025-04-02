import { Box, Container, Heading, Text } from '@chakra-ui/react';

export const BlogHeader = () => {
  return (
    <Box bgGradient="linear(to-b, #3B2A66, #4E51BF)" color="white" py={16} textAlign="center">
      <Container maxW="container.xl">
        <Heading as="h1" size="2xl" mb={4}>
          Blog
        </Heading>
        <Text fontSize="lg">
          Stay up to date with the latest news, tutorials, and updates from the Valkey team.
        </Text>
      </Container>
    </Box>
  );
};
