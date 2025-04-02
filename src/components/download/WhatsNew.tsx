import { Box, Heading, Link, List, ListItem } from '@chakra-ui/react';
import { releaseNotes } from '../../data/releaseNotes';

export const WhatsNew = () => {
  const renderListItem = (item: string, index: number) => {
    // Check if this is an asset link
    const isAsset = item.includes('Source code') || item.includes('View on GitHub');
    if (isAsset) {
      const [text, url] = item.split(': ');
      return (
        <ListItem key={index} borderBottom={'1px solid #9D9D9D'} pb={2} pl={'2'}>
          • {text}:{' '}
          <Link href={url} color="blue.500" isExternal>
            Download
          </Link>
        </ListItem>
      );
    }

    return (
      <ListItem key={index} borderBottom={'1px solid #9D9D9D'} pb={2} pl={'2'}>
        • {item}
      </ListItem>
    );
  };

  return (
    <Box bg={'rgba(209, 217, 255, 0.5)'} p={6} borderRadius={'2'}>
      {releaseNotes.sections.map((section, sectionIndex) => (
        <Box key={section.title} mb={sectionIndex !== releaseNotes.sections.length - 1 ? 6 : 0}>
          <Heading as="h3" size="sm" mb={2} color={'secondary.lavender.text'}>
            {section.title}
          </Heading>
          <List spacing={2} color={'#353535'}>
            {section.items.map((item, itemIndex) => renderListItem(item, itemIndex))}
          </List>
        </Box>
      ))}
    </Box>
  );
};
