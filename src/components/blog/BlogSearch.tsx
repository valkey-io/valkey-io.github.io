import { Box, Button, Input, Select } from '@chakra-ui/react';
import { FormEvent } from 'react';
import { categories } from '../../data/blogPosts';
import { BlogPost } from '../../data/types';

type Category = BlogPost['category'];

interface BlogSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: Category | '';
  setSelectedCategory: (category: Category | '') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const BlogSearch = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDate,
  setSelectedDate,
}: BlogSearchProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // The search is already live, but this prevents form submission
  };

  return (
    <>
      <Box as="form" display="flex" onSubmit={handleSubmit} mb={'2'}>
        <Input
          placeholder="Search articles"
          bg="white"
          borderRadius="md"
          mb={1}
          borderRightRadius={'0'}
          borderLeftRadius={'50px'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Button type="submit" variant="violet" borderRightRadius={'50px'}>
          Search
        </Button>
      </Box>

      <Box color={'secondary.purple.500'} mb={0}>
        Filters
      </Box>

      <Box mb={4}>
        <Select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as Category | '')}
          bg="white"
          borderRadius="md"
          placeholder="All Categories"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
      </Box>

      <Box mb={4}>
        <Input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          bg="white"
          borderRadius="md"
        />
      </Box>
    </>
  );
};
