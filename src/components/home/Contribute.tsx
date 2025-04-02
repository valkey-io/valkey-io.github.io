import {
  Box,
  Container,
  Heading,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';

import { contributeWays } from '../../data/contributeWays';
import { ContributeGrid } from './ContributeGrid';
import ValkeyIcon from '/src/assets/images/valkey-icon-black.svg';

export const Contribute = () => {
  return (
    <Box
      as="section"
      pb={{ base: '4rem', md: '8rem' }}
      bgGradient="linear(to-b, #30176E, #6983FF)"
      pos={'relative'}
      id="how-to-contribute"
      overflowX={'hidden'}
    >
      <Image
        pos={'absolute'}
        zIndex={'0'}
        h={'500px'}
        w={'500px'}
        src={ValkeyIcon}
        alt="Valkey.io"
        top={'0'}
        right={'0'}
        marginRight={'-50px'}
        opacity={'10%'}
      />

      <Container maxW="7xl" position={'relative'} zIndex={'1'}>
        <Stack spacing={12}>
          <Stack spacing={4} textAlign="center">
            <Heading as="h2" fontSize={{ base: "32px", md: "60px" }} color="white">
              How to contribute?
            </Heading>
            <Text fontSize="lg" color="white" maxW="3xl" mx="auto">
              We welcome your involvement in the Valkey community! Here are several ways you can
              contribute:
            </Text>
          </Stack>

          <ContributeGrid contributeWays={contributeWays} />
        </Stack>
      </Container>
    </Box>
  );
};
