import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ShowCase as ShowCaseType } from '../../data/showCase';

interface ShowCaseProps {
  latestShowCase: ShowCaseType[];
}

export const ShowCase: React.FC<ShowCaseProps> = ({ latestShowCase }) => {
  return (
    <>
      <Stack mt={'70px'} py={'10'} color={'secondary.purple.500'} maxW="7xl">
        <Heading as="h2" size="lg" textAlign="center">
          Community Highlights
        </Heading>
        <Text textAlign="center">
          Explore the latest updates, tutorials, and case studies from our community.
        </Text>
      </Stack>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={8} w="100%" mb={'120px'}>
        {latestShowCase.map((showCase, index) => (
          <Box key={index} borderRadius="20px" overflow="hidden" bg="white" boxShadow="md">
            <Image
              src={showCase.imageUrl}
              alt={showCase.title}
              width="100%"
              height="100px"
              objectFit="cover"
            />
            <Flex p={6} minH={'calc(100% - 100px)'} flexDir={'column'}>
              <Heading as="h3" lineHeight={'1.4'} fontSize={'16px'} mb={2}>
                {showCase.title}
              </Heading>
              <Text mb={4} fontSize={'16px'} noOfLines={2}>
                {showCase.excerpt}
              </Text>
              
              <Box textAlign={'right'} marginTop={'auto'}>
                <Button
                  as={Link}
                  to={`/community/show-case/${showCase.slug}`}
                  variant="outline"
                  borderWidth={'1px'}
                  borderColor={'#072150'}
                  color={'#072150'}
                  borderRadius={'30px'}
                  _hover={{
                    borderColor: '#072150',
                    color: 'white',
                    background: '#072150',
                  }}
                >
                  Read More
                </Button>
              </Box>
            </Flex>
          </Box>
        ))}
      </Grid>
    </>
  );
};
