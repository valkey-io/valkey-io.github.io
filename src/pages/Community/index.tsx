import {
  Box,
  Container,
  Heading,
  Stack,
  Text
} from '@chakra-ui/react';
import { ContributeGrid } from '../../components/home/ContributeGrid';
import { contributeWays } from '../../data/contributeWays';
// import { ShowCase } from '../../components/community/ShowCase';
// import { mockShowCases } from '../../data/showCase';

const CommunityPage = () => {
  return (
    <Box>
      <Box bgGradient="linear(to-b, #3B2A66, #4E51BF)" color="white" py={16} textAlign="center">
        <Container maxW="container.xl">
          <Heading as="h1" size="2xl" mb={4}>
            Community
          </Heading>
        </Container>
      </Box>
      
      <Stack spacing={8} align="center" background={'#E2E8F0'}>
        <Container maxW="container.xl" pb={'40px'}>
          <Stack py={'10'} color={'secondary.purple.500'} maxW="7xl">
            <Heading as="h2" fontSize={{ base: "32px", md: "60px" }} textAlign="center">
              How to Contribute?
            </Heading>
            <Text textAlign="center">
              We welcome your involvement in the Valkey community! Here are several ways you can
              contribute:
            </Text>
          </Stack>
        
          <ContributeGrid contributeWays={contributeWays}/>
          {/* <ShowCase latestShowCase={mockShowCases} /> */}

        </Container>
      </Stack>

      
    </Box>
  );
};

export default CommunityPage;
