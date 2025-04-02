import { Box, Link, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { commandReferences } from '../../data/commandReference';

interface CommandReferenceSidebarProps {
  searchQuery: string;
  selectedCommand: typeof commandReferences[0] | null;
  onCommandSelect: (command: typeof commandReferences[0]) => void;
}

export const CommandReferenceSidebar = ({ 
  searchQuery, 
  selectedCommand, 
  onCommandSelect 
}: CommandReferenceSidebarProps) => {
  const navigate = useNavigate();

  // Trim the search query to handle whitespace
  const trimmedQuery = searchQuery.trim();

  // Filter items if there's a search query
  const filteredItems = trimmedQuery
    ? commandReferences.filter(item =>
        item.command.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    : commandReferences;

  // Only show no results message if we have a non-empty search query AND no results
  if (trimmedQuery !== '' && filteredItems.length === 0) {
    return (
      <Box borderRadius={'2px'} p={8} textAlign="center">
        <Text fontWeight="800" color="secondary.purple.500" mb={1} fontSize={{ base: "32px", md: "60px" }}>
          &lt;/&gt;
        </Text>
        <Text fontWeight="medium" color="secondary.purple.500" mb={1}>
          We couldn't find any results matching your search
        </Text>
        <Text color="secondary.purple.500">Check your spelling or try different keywords</Text>
      </Box>
    );
  }

  const handleCommandSelect = (command: typeof commandReferences[0]) => {
    onCommandSelect(command);
    // Convert command to URL-friendly format (lowercase with hyphens)
    const urlCommand = command.command.toLowerCase().replace(/\s+/g, '-');
    navigate(`/commands/${urlCommand}`);
  };

  // Show filtered results
  return (
    <VStack
      align="stretch" 
      spacing={6}
      h={{base: 'auto', md: 'calc(100vh - 174px)'}}
      overflowX={{base: 'visible', md: 'auto'}}
    >
      <Box>
        <Box mb={4}>
          <VStack align="stretch">
            {filteredItems.map(item => (
              <Link
                key={item.command}
                onClick={() => handleCommandSelect(item)}
                p={2}
                background={selectedCommand?.command === item.command ? 'primary.200' : 'primary.100'}
                _hover={{ bg: 'primary.200' }}
                cursor="pointer"
              >
                <Text fontWeight="medium">{item.command}</Text>
              </Link>
            ))}
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
};
