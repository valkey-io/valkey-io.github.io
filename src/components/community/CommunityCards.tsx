import {
  Button,
  Card,
  Grid,
  GridItem,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { CommunityCard } from '../../data/communityCards';

export const CommunityCards = ({ cards }: { cards: CommunityCard[] }) => (
  <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8} w="100%" mt={'120px'}>
    {cards.map((card, index) => (
      <GridItem key={index}>
        <Card
          height="100%"
          p={8}
          align="center"
          borderRadius={'20px'}
          background={'secondary.purple.500'}
          color="white"
        >
          <Stack spacing={4}>
            <Heading as="h3" size="20px" textAlign={'center'}>
              {card.title}
            </Heading>
            <Text>{card.description}</Text>
            <Stack
              direction="row"
              spacing={4}
              mt={'auto'}
              width={'100%'}
              justifyContent={'flex-end'}
            >
              <Button 
                as={Link} 
                to={card.link}
                variant="outline"
                colorScheme="white"
                borderWidth={'1px'}
                borderColor={'white'}
                color={'white'}
                borderRadius={'20px'}
                _hover={{
                  borderColor: 'white',
                  color: '#072150',
                  background: 'white',
                }}
              >
                {card.buttonText}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </GridItem>
    ))}
  </Grid>
); 