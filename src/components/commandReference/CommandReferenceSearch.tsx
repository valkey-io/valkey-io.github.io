import { Box, Button, Input } from '@chakra-ui/react';

interface CommandReferenceSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CommandReferenceSearch = ({
  searchQuery,
  setSearchQuery,
}: CommandReferenceSearchProps) => {
  return (
    <Box display="flex" mb={4}>
      <Input
        placeholder="Search commands"
        bg="white"
        borderRadius="md"
        mb={1}
        borderRightRadius={'0'}
        borderLeftRadius={'50px'}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <Button variant="violet" borderRightRadius={'50px'}>
        Search
      </Button>
    </Box>
  );
};
