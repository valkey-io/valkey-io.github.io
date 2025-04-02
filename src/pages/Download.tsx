import { Box, Button, Container, Flex, Heading, Stack, Text, VStack } from '@chakra-ui/react';
import { PreviousReleases } from '../components/download/PreviousReleases';
import { WhatsNew } from '../components/download/WhatsNew';
import { releaseNotes } from '../data/releaseNotes';

export const Download = () => {
  return (
    <>
      <Box pt={20} bgGradient="linear(to-b, #E9EBF8, #ffffff)">
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            {/* Latest Release Section */}
            <Box>
              <Heading as="h1" fontSize={{ base: "32px", md: "60px" }}mb={8} textAlign="center" color="secondary.purple.500">
                Get the Latest Release
              </Heading>

              <Flex 
                alignItems={{ base: 'flex-start', md: 'flex-end' }}
                justifyContent={{ base: 'flex-start', md: 'space-between' }}
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 4, md: 0 }}
              >
                <Stack gap={0} color="secondary.purple.500">
                  <Heading as="h2" size="md">
                    Release Notes
                  </Heading>
                  <Text size="md" fontWeight={'bold'}>
                    Version: {releaseNotes.version}
                  </Text>
                  <Text>Release Date: {releaseNotes.releaseDate}</Text>
                </Stack>

                <Button
                  as="a"
                  href={releaseNotes.sourceCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="violet"
                >
                  View Source Code on GitHub
                </Button>
              </Flex>
            </Box>

            {/* What's New Section */}
            <WhatsNew />

          </VStack>
        </Container>
      </Box>
      <Box bg={'white'}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Previous Releases Section */}
            <PreviousReleases />
          </VStack>
        </Container>
      </Box>
    </>
  );
};
