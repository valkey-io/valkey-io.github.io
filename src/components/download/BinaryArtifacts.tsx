import { Box, Heading, Link, VStack } from '@chakra-ui/react';

export const BinaryArtifacts = () => {
  return (
    <Box bg={'rgba(209, 217, 255, 0.5)'} p={6} borderRadius={'2'}>
      <Heading as="h2" textAlign={'center'} size="lg" mb={4} color={'secondary.lavender.text'}>
        Binary Artifacts
      </Heading>
      <VStack
        align="stretch"
        spacing={2}
        color={'#353535'}
        textDecor={'underline'}
        fontSize={'90%'}
      >
        <Link bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          arm64 / bionic (sha256)
        </Link>
        <Link bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          x86_64 / bionic (sha256)
        </Link>
        <Link bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          arm64 / focal (sha256)
        </Link>
        <Link bg={'rgba(209, 217, 255, 0.6)'} p={2}>
          x86_64 / focal (sha256)
        </Link>
      </VStack>
    </Box>
  );
};
