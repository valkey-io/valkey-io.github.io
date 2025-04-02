import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';

export const About = () => {
  return (
    <Box as="section" py={{ base: '4rem', md: '8rem' }} bg="white">
      <Container maxW="7xl">
        <Stack spacing={12}>
          <Stack spacing={4} textAlign="center">
            <Heading as="h2" fontSize={{ base: "32px", md: "60px" }} color={'#6983FF'}>
              About
            </Heading>
          </Stack>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems={'center'}>
            <Box>
              <Text as={'p'} fontSize={'20px'} textAlign={'center'}>
                Valkey is a high-performance, open-source key/value datastore under the BSD license
                that handles various workloads, including caching and message queues, and can serve
                as a primary database. It can operate as a standalone service or in a cluster,
                offering options for data replication and high availability. Valkey supports
                multiple data types such as strings, numbers, lists, and more, allowing users to
                manipulate data directly with a rich set of commands. Additionally, it features
                built-in scripting for Lua and supports plugins for creating new commands and data
                types.
              </Text>
            </Box>
            <Box position={'relative'}>
              <Flex
                alignItems={'flex-end'}
                padding={{ base: '0 0 0 60px', md: '0 0 40px 0' }}
                flexDirection={{ base: 'column', md: 'row' }}
                position={'relative'}
                gap={'4'}
                marginBottom={{ base: '4', md: '0' }}
              >
                <Box
                  textAlign={{ base: 'left', md: 'center' }}
                  width={{ base: 'auto', md: '30%' }}
                  marginLeft={{ base: '0', md: '5%' }}
                  position={'relative'}
                  _after={{
                    content: { base: 'none', md: '""' },
                    position: 'absolute',
                    bottom: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '20px solid #c2e270',
                  }}
                >
                  <Text as={'p'} fontWeight={'bold'}>
                    Origin and Foundation:
                  </Text>
                  <Text as={'p'} fontSize={'14px'} textAlign={{ base: 'left', md: 'center' }}>
                    Valkey is derived from Redis, an open-source database created by Salvatore
                    Sanfilippo in 2009. Redis gained popularity with early adopters like GitHub and
                    Instagram.
                  </Text>
                </Box>
                <Box
                  textAlign={{ base: 'left', md: 'center' }}
                  width={{ base: 'auto', md: '30%' }}
                  marginLeft={{ base: '0', md: '10%' }}
                  position={'relative'}
                  _after={{
                    content: { base: 'none', md: '""' },
                    position: 'absolute',
                    bottom: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '20px solid #b9de84',
                  }}
                >
                  <Text as={'p'} fontWeight={'bold'}>
                    Transition to Valkey:
                  </Text>
                  <Text as={'p'} fontSize={'14px'} textAlign={{ base: 'left', md: 'center' }}>
                    In 2024, following Redis Ltd's license change from an open-source BSD license to
                    dual source-available licenses, a group of contributors launched Valkey to
                    continue the project under the open-source BSD license.
                  </Text>
                </Box>
              </Flex>

              <Flex
                padding={{ base: '10%     0', md: '0 20px' }}
                h={{ base: '100%', md: '24px' }}
                w={{ base: '50px', md: '100%' }}
                background={{
                  base: 'linear-gradient(45deg, #072150, #4EA4CD, #CDEA71, #ACD56F)',
                  md: 'linear-gradient(45deg, #ACD56F, #CDEA71, #4EA4CD, #072150)',
                }}
                justifyContent={'space-between'}
                alignItems={'center'}
                borderRadius={'2px'}
                position={{ base: 'absolute', md: 'initial' }}
                top={'0'}
                flexDirection={{ base: 'column', md: 'row' }}
                fontSize={{ base: '12px', md: '14px' }}
                fontWeight={'bold'}
              >
                <Text color={'#000000'}>2009</Text>
                <Text color={'#ffffff'}>2025</Text>
              </Flex>

              <Flex
                paddingTop={'40px'}
                padding={{ base: '0 0 0 60px', md: '40px 0 0 0' }}
                flexDirection={{ base: 'column', md: 'row' }}
                gap={'4'}
              >
                <Box
                  textAlign={{ base: 'left', md: 'center' }}
                  width={{ base: 'auto', md: '30%' }}
                  marginLeft={{ base: '0', md: '25%' }}
                  position={'relative'}
                  _after={{
                    content: { base: 'none', md: '""' },
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: '20px solid #b9de83',
                  }}
                >
                  <Text as={'p'} fontWeight={'bold'}>
                    Community and Support:
                  </Text>
                  <Text as={'p'} fontSize={'14px'} textAlign={{ base: 'left', md: 'center' }}>
                    Valkey is supported by diverse contributors from leading tech companies,
                    ensuring its development remains open-source and community-driven.
                  </Text>
                </Box>
                <Box
                  textAlign={{ base: 'left', md: 'center' }}
                  width={{ base: 'auto', md: '30%' }}
                  marginLeft={{ base: '0', md: '10%' }}
                  position={'relative'}
                  _after={{
                    content: { base: 'none', md: '""' },
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: '20px solid #3779a4',
                  }}
                >
                  <Text as={'p'} fontWeight={'bold'}>
                    Development and Contributions:
                  </Text>
                  <Text as={'p'} fontSize={'14px'} textAlign={{ base: 'left', md: 'center' }}>
                    Over the years, companies like VMware and Pivotal supported Redis, contributing
                    to its growth and development. Many individuals and organizations played
                    significant roles in shaping its features.
                  </Text>
                </Box>
              </Flex>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};
