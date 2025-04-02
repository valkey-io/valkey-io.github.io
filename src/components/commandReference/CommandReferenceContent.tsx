import { Box, Flex, Link, Select, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commandCategories, commandReferences } from '../../data/commandReference';
import { CommandReference } from '../../types/commandReference';

interface CommandReferenceContentProps {
  selectedCommand: typeof commandReferences[0] | null;
  onBack: () => void;
  onCommandSelect: (command: typeof commandReferences[0]) => void;
}

export const CommandReferenceContent = ({ selectedCommand, onBack, onCommandSelect }: CommandReferenceContentProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  // Debug: Inspect string contents
  const inspectString = (str: string) => {
    return str.split('').map(char => char.charCodeAt(0)).join(',');
  };

  // Sort categories alphabetically (case-insensitive)
  const sortedCategories = [...commandCategories].sort((a, b) => {
    const aName = a.categoryName.toLowerCase().trim();
    const bName = b.categoryName.toLowerCase().trim();
    console.log(`Comparing "${aName}" (${inspectString(aName)}) with "${bName}" (${inspectString(bName)})`);
    return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
  });

  // Debug: Log sorted categories
  console.log('Sorted categories:', sortedCategories);

  // Group commands by category
  const commandsByCategory = sortedCategories.map(category => ({
    ...category,
    commands: commandReferences.filter(cmd => 
      selectedCategory === 'all' 
        ? cmd.categories.includes(category.id)
        : cmd.categories.includes(selectedCategory) && cmd.categories.includes(category.id)
    )
  })).filter(category => category.commands.length > 0);
  
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
  };

  const handleCommandSelect = (command: CommandReference) => {
    onCommandSelect(command);
    // Convert command to URL-friendly format (lowercase with hyphens)
    const urlCommand = command.command.toLowerCase().replace(/\s+/g, '-');
    navigate(`/commands/${urlCommand}`);
  };

  const handleBack = () => {
    onBack();
    navigate('/commands');
  };

  return (
    <Box>
      <Box p={4}>
        {selectedCommand && (
          <Box mb={4} background={'white'} borderRadius={'50px'} px={4} py={2}>
            <Text color="gray.600" fontSize="sm">
              <Link color={'primary.500'} textDecoration={'underline'} onClick={handleBack} cursor="pointer">
                {selectedCommand.categories[0].toUpperCase()}
              </Link>
              {' / '}{selectedCommand.command}
            </Text>
          </Box>
        )}

        {!selectedCommand ? (
          <>
            <Flex
              mb={0}
              background={'white'}
              borderTopRadius={'20px'}
              px={4}
              py={2}
              borderBottom={'1px solid #6893EE'}
              alignItems={'center'}
            >
              <Text color="gray.600" fontSize="sm" flex={'1'} whiteSpace={'nowrap'} mr={2}>
                Command category:
              </Text>
              <Select
                variant="lined"
                borderRadius="md"
                border={'1px solid'}
                borderColor={'#E2E8F0'}
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="all">All</option>
                {commandsByCategory.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName.charAt(0).toUpperCase() + category.categoryName.slice(1)}
                  </option>
                ))}
              </Select>
            </Flex>

            <Box background={'white'} borderRadius={'2px'} p={4}>
              {commandsByCategory.length > 0 ? (
                commandsByCategory.map((category) => (
                  <Box key={category.id} mb={6}>
                    <Flex
                      alignItems="center"
                      mb={2}
                      borderBottom={'1px solid'}
                      borderColor={'rgba(188, 181, 231, 0.4)'}
                      pb={2}
                    >
                      <Text fontWeight="bold" mr={2}>
                        {category.categoryName.toUpperCase()}
                      </Text>
                      <Text color="gray.600">{category.description}</Text>
                    </Flex>

                    <Box>
                      {category.commands.map((command: CommandReference) => (
                        <Flex
                          key={command.unid}
                          mb={4}
                          borderBottom={'1px solid'}
                          borderColor={'rgba(188, 181, 231, 0.4)'}
                          pb={2}
                        >
                          <Link 
                            color="blue.500" 
                            textDecor={'underline'} 
                            onClick={() => handleCommandSelect(command)}
                            cursor="pointer"
                          >
                            {command.command}
                          </Link>
                          <Text ml={1}>{command.description}</Text>
                        </Flex>
                      ))}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box borderRadius={'2px'} p={8} textAlign="center">
                  <Text fontWeight="800" color="secondary.purple.500" mb={1} fontSize={{ base: "32px", md: "60px" }}>
                    &lt;/&gt;
                  </Text>
                  <Text fontWeight="medium" color="secondary.purple.500" mb={1}>
                    We couldn't find any results matching your search
                  </Text>
                  <Text color="secondary.purple.500">Check your spelling or try different keywords</Text>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box background={'white'} borderRadius={'2px'} p={4}>
            <Box mb={6}>
              <Flex
                alignItems="center"
                mb={4}
                borderBottom={'1px solid'}
                borderColor={'rgba(188, 181, 231, 0.4)'}
                pb={2}
              >
                <Text fontWeight="bold" mr={2}>
                  {selectedCommand.command}
                </Text>
                <Text color="gray.600">{selectedCommand.description}</Text>
              </Flex>

              {selectedCommand.htmlContent && (
                <Box 
                  className="commands-content"
                  dangerouslySetInnerHTML={{ __html: selectedCommand.htmlContent }}
                  sx={{
                    'dl': {
                      marginBottom: '1rem',
                    },
                    'dt': {
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                    },
                    'dd': {
                      marginLeft: '1rem',
                    },
                    'code': {
                      backgroundColor: 'gray.100',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '0.2rem',
                      fontFamily: 'monospace',
                    },
                    'pre': {
                      backgroundColor: '#2b303b',
                      color: '#ffffff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem',
                      overflowX: 'auto',
                    },
                    'pre code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                    },
                    'h2': {
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginTop: '2rem',
                      marginBottom: '1rem',
                    },
                    'h3': {
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginTop: '1.5rem',
                      marginBottom: '0.75rem',
                    },
                    'p': {
                      marginBottom: '1rem',
                    },
                    'table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '1rem',
                    },
                    'th, td': {
                      border: '1px solid',
                      borderColor: 'gray.200',
                      padding: '0.5rem',
                    },
                    'th': {
                      backgroundColor: 'gray.50',
                      fontWeight: 'bold',
                    },
                    'ol': {
                      paddingLeft: '25px',
                    },
                    'ul': {
                      paddingLeft: '25px',
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
