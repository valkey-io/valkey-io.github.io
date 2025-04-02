import { Box } from '@chakra-ui/react';
import { Contribute } from '../components/home/Contribute';
import { Documentation } from '../components/home/Documentation';
import { Hero } from '../components/home/Hero';
import { Participants } from '../components/home/Participants';
import { WhatsNew } from '../components/home/WhatsNew';

export const Home = () => {
  return (
    <Box>
      <Hero />
      {/* <About /> */}
      <Documentation />
      <WhatsNew />
      <Contribute />
      <Participants />
    </Box>
  );
};
