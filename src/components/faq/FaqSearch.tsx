import { Box, Button, Input } from '@chakra-ui/react';
import { FormEvent } from 'react';

interface FaqSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const FaqSearch = ({ searchQuery, setSearchQuery }: FaqSearchProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // The search is already live, but this prevents form submission
  };

  return (
    <Box as="form" display="flex" mb={'2'} onSubmit={handleSubmit}>
      <Input
        placeholder="What can we help you with?"
        bg="white"
        borderRadius="md"
        mb={1}
        borderRightRadius={'0'}
        borderLeftRadius={'50px'}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <Button 
        type="submit"
        variant="violet" 
        borderRightRadius={'50px'}
      >
        Search
      </Button>
    </Box>
  );
};
