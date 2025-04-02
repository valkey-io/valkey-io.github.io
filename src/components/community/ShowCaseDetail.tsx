import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text
} from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShowCase } from '../../data/showCase';
import { Breadcrumbs } from '../common/Breadcrumbs';

interface ShowCaseDetailProps {
  showCase: ShowCase;
  otherShowCases: ShowCase[];
}

export const ShowCaseDetail: React.FC<ShowCaseDetailProps> = ({ showCase, otherShowCases }) => {

  const breadcrumbItems = [
    { label: 'Community', href: '/community' },
    { label: showCase.title }
  ];

  return (
    <Container maxW="none" p={0} background={'#E9EBF8'}>
      <Breadcrumbs items={breadcrumbItems} />
      <Flex gap={0} minH={'100%'}>
      
        {/* Main Content */}
        <Box
          flex="1"
          background={'#E2E8F0'}
          padding={'4'}
          h={'calc(100vh - 185px)'}
          overflowX={'auto'}
        >
          <Box flex="1" background={'white'} padding={'4'}>
            <Heading as="h1" fontSize="28px" fontWeight="bold" mb={0} color={'secondary.purple.500'}>
              {showCase.title}
            </Heading>

            <Text color="gray.500" mb={2}>
              {new Date(showCase.date).toLocaleDateString()}
            </Text>

            {showCase.imageUrl && (
                <Image
                  src={showCase.imageUrl}
                  alt={showCase.title}
                  width="100%"
                  height={'300px'}
                  objectFit={'cover'}
                  borderRadius="lg"
                  mb={8}
                />
            )}

            <Box className="case-study-content">
              <Box 
                className="showcase-content" 
                mb={4} 
                sx={{
                  'h2': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    mb: 2,
                    color: 'secondary.purple.500'
                  },
                  'h3': {
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    mb: 2,
                    color: 'secondary.purple.500'
                  },
                  'p': {
                    mb: 3
                  },
                  'ul': {
                    pl: 4,
                    mb: 3
                  },
                  'li': {
                    mb: 1
                  },
                  'b': {
                    fontWeight: 'bold',
                    color: 'secondary.purple.500'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: showCase.content }}
              />
            </Box>

          </Box>
        </Box>

        {/* Sidebar */}
        <Box w="33%" h={'calc(100vh - 185px)'} overflowX={'auto'} backgroundColor={'#DADEEE'} p={4}>
          <Box>
            <Heading as="h2" size="md" mb={2} color="purple.700">
              OTHER CASE STUDIES
            </Heading>
            <Stack spacing={6}>
              {otherShowCases.slice(0, 4).map((otherCase, index) => (
                <Box
                  key={index}
                  bg="white"
                  borderRadius="20px"
                  overflow="hidden"
                  boxShadow="sm"
                >
                  <Image
                    src={otherCase.imageUrl}
                    alt={otherCase.title}
                    width="100%"
                    height="120px"
                    objectFit="cover"
                  />
                  <Box p={4}>
                    <Heading as="h3" size="sm" mb={2}>
                      {otherCase.title}
                    </Heading>
                    <Text fontSize="sm" mb={4} noOfLines={2}>
                      {otherCase.excerpt}
                    </Text>
                    <Box textAlign="right">
                      <Button
                        as={Link}
                        to={`/community/show-case/${otherCase.slug}`}
                        variant="outline"
                        borderWidth={'1px'}
                        size="md"
                        borderRadius={'50px'}
                        alignSelf={'flex-end'}
                        marginLeft={'auto'}
                        _hover={{
                          borderColor: '#072150',
                          color: 'white',
                          background: '#072150',
                        }}
                      >
                        Read More
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
}; 