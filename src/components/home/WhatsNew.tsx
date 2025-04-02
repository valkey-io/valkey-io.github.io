import {
  Box,
  Button,
  Container,
  Flex,
  GridItem,
  Heading,
  Image,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { blogDigest } from '../../data/blogPosts';
import { releaseNotes } from '../../data/releaseNotes';

// Get the two latest blog posts
const latestBlogPosts = blogDigest.slice(0, 2);

export const WhatsNew: React.FC = () => {
  return (
    <Box as="section" pb={{ base: '4rem', md: '8rem' }} bgGradient="linear(to-b, #6983FF, #30176E)">
      <Container maxW={'7xl'}>
        <Heading textAlign={'center'} fontSize={{ base: "32px", md: "60px" }} py={10} fontWeight={'bold'} color={'white'}>
          What's New?
        </Heading>

        <SimpleGrid
          columns={{ base: 1, lg: 3 }}
          spacing={8}
          p={'8'}
          borderRadius={'20px'}
          bg={'rgba(255, 255, 255, 0.2)'}
        >
          {/* Release Notes Section */}
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box>
              <Heading as="h2" fontSize="30px" mb={8} color={'white'}>
                Release Notes
              </Heading>
              <Flex justifyContent={'space-between'} alignItems={'flex-start'}>
                <Box>
                  <Text fontSize="20px" fontWeight="bold" color={'white'}>
                    Version: {releaseNotes.version}
                  </Text>
                  <Text fontSize="20px" fontWeight="400" color={'white'}>
                    Release Date: {releaseNotes.releaseDate}
                  </Text>
                </Box>
                <Button
                  as="a"
                  href="/download"
                  size="lg"
                  colorScheme="blue"
                  variant="outline"
                  borderWidth={'1px'}
                  borderColor={'white'}
                  color={'white'}
                  borderRadius={'30px'}
                  _hover={{
                    borderColor: '#ffffff',
                    color: '#072150',
                    background: '#ffffff',
                  }}
                >
                  Release Notes
                </Button>
              </Flex>

              <VStack
                align="stretch"
                spacing={6}
                background={'white'}
                borderRadius={'20px'}
                mt={'6'}
                padding={'8'}
              >
                {releaseNotes.sections.map(section => (
                  <Box key={section.title}>
                    <Heading as="h3" fontSize={'16px'} mb={3}>
                      {section.title}
                    </Heading>
                    <UnorderedList spacing={2} fontSize={'16px'}>
                      {section.items.map((item, index) => (
                        <ListItem
                          borderBottom={'1px solid'}
                          borderColor={'rgba(157, 157, 157, 0.5)'}
                          mb={'2'}
                          pb={'2'}
                          key={index}
                        >
                          {item}
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </Box>
                ))}
              </VStack>
            </Box>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 1 }}>
            {/* Latest Blog Posts Section */}
            <Box>
              <Heading as="h2" fontSize="30px" mb={8} color={'white'}>
                Latest From Our Blog
              </Heading>
              <VStack spacing={6}>
                {latestBlogPosts.map((post, index) => (
                  <Box key={index} borderRadius="20px" overflow="hidden" bg="white" boxShadow="md">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width="100%"
                      height="100px"
                      objectFit="cover"
                    />
                    <Box p={6}>
                      <Heading as="h3" lineHeight={'1.4'} fontSize={'16px'} mb={2}>
                        {post.title}
                      </Heading>
                      <Text mb={4} fontSize={'16px'}>
                        {post.excerpt}
                      </Text>
                      <Box textAlign={'right'}>
                        <Button
                          as="a"
                          href={`/blog/${post.slug}`}
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
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>
          </GridItem>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default WhatsNew;
