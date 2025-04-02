import { Box, Button, Code, Heading, Text, VStack } from '@chakra-ui/react';

export const DockerHub = () => {
  return (
    <Box bg={'rgba(209, 217, 255, 0.5)'} p={6} borderRadius={'2'}>
      <Heading as="h2" textAlign={'center'} size="lg" mb={2} color={'secondary.lavender.text'}>
        Docker Hub
      </Heading>
      <Heading as="h3" size="sm" mb={2} color={'secondary.lavender.text'}>
        Tags
      </Heading>
      <VStack align="stretch" spacing={2} color={'#353535'}>
        <Code bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          valkey/valkey:7.2.8
        </Code>
        <Code bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          valkey/valkey:7.2.8-bookworm
        </Code>
        <Code bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          valkey/valkey:7.2.8-alpine
        </Code>
        <Code bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          valkey/valkey:7.2.8-alpine3.21
        </Code>
      </VStack>
      <Text mt={3} color={'secondary.lavender.text'}>
        Example:
      </Text>
      <VStack align="stretch" spacing={2} color={'#353535'} mb={3}>
        <Code bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          docker run --rm valkey/valkey:7.2.8
        </Code>
      </VStack>
      <Button size="sm" variant="violet">
        Go to Docker Hub
      </Button>
    </Box>
  );
};
