import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  Link,
  List,
  ListItem,
  Text,
} from '@chakra-ui/react';
import { previousReleases } from '../../data/releaseNotes';

export const PreviousReleases = () => {
  return (
    <Box bg={'rgba(209, 217, 255, 0.5)'} p={6} borderRadius={'2'}>
      <Box mb={4}>
        <Heading as="h2" size="md" color="secondary.purple.500">
          Previous Releases
        </Heading>
        <Text as="p">
          Check previous releases download links, including any security fixes for previous released
          versions.
        </Text>
      </Box>
      <Accordion allowToggle>
        {previousReleases.map(group => (
          <AccordionItem key={group.majorVersion} mb={2}>
            <AccordionButton
              border={'none'}
              borderRadius={0}
              bg={'rgba(250, 251, 255, 1)'}
              p={2}
              _hover={{
                bg: 'rgba(250, 251, 255, 1)',
              }}
            >
              <Box flex="1" textAlign="left" fontSize={'90%'}>
                {group.majorVersion}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel p={0}>
              <List spacing={1} mt={'1'}>
                {group.releases.map(release => (
                  <ListItem key={release.version} bg={'rgba(244, 246, 255, 1)'} p={2} mb={'1px'}>
                    <Link href={release.url} fontSize={'90%'} textDecoration={'underline'}>
                      {release.version} (Released {release.releaseDate})
                    </Link>
                  </ListItem>
                ))}
              </List>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};
