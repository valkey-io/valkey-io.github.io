import {
  Button,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ContributeWay } from '../../data/contributeWays';

interface ContributeGridProps {
  contributeWays: ContributeWay[];
}

export const ContributeGrid = ({ contributeWays }: ContributeGridProps) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
      {contributeWays.map(way => (
        <Stack
          key={way.title}
          p={8}
          align="center"
          borderRadius={'20px'}
          background={'white'}
          color="#072150"
        >
          <Icon as={way.icon} boxSize={'48px'} mb={'1'} color={'#BCB5E7'} />
          <Heading as="h3" size="md" textAlign="center">
            {way.title}
          </Heading>
          <Text textAlign={'left'} mb={'2'}>
            {way.description}
          </Text>
          {way.buttons && (
            <Stack
              direction="row"
              spacing={4}
              mt={'auto'}
              width={'100%'}
              justifyContent={'center'}
            >
              {way.buttons.map((button, index) => (
                <Button
                  key={index}
                  as="a"
                  href={button.href}
                  variant="outline"
                  colorScheme="white"
                  borderWidth={'1px'}
                  borderColor={'#072150'}
                  color={'#072150'}
                  borderRadius={'20px'}
                  _hover={{
                    borderColor: '#ffffff',
                    color: '#ffffff',
                    background: '#072150',
                  }}
                >
                  {button.icon && <Icon as={button.icon} mr={1} />}
                  {button.label}
                </Button>
              ))}
            </Stack>
          )}
        </Stack>
      ))}
    </SimpleGrid>
  );
}; 