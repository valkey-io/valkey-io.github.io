import { Box, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { documentationData } from '../../data/documentation';
import { topics } from '../../data/topics';

export const DocumentationContent = () => {
  const { topicId } = useParams();
  const [selectedTopic, setSelectedTopic] = useState(topics.find(t => t.id === topicId));

  useEffect(() => {
    if (topicId) {
      const topic = topics.find(t => t.id === topicId);
      setSelectedTopic(topic);
    } else {
      setSelectedTopic(undefined);
    }
  }, [topicId]);

  const content = selectedTopic 
    ? selectedTopic.htmlContent 
    : documentationData.introduction.content || '';

  return (
    <Box p={4}>
      {selectedTopic && (
        <Box mb={4} background={'white'} borderRadius={'50px'} px={4} py={2}>
          <Text color="gray.600" fontSize="sm">
            <RouterLink to="/topics" style={{ color: '#646cff', textDecoration: 'underline' }}>
              Documentation
            </RouterLink>
            {' / '}
            <Text as="span" color="gray.600">
              {selectedTopic.topicName}
            </Text>
          </Text>
        </Box>
      )}

      <Box background={'white'} borderRadius={'2px'} p={'4'}>
        <Box
          className="blog-content"
          sx={{
            'h2': {
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '24px',
              marginBottom: '16px',
              color: 'secondary.purple.500'
            },
            'h3': {
              fontSize: '18px',
              fontWeight: 'bold',
              marginTop: '24px',
              marginBottom: '16px',
              color: 'secondary.purple.500'
            },
            'h4': {
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '24px',
              marginBottom: '16px',
              color: 'secondary.purple.500'
            },
            'p': {
              marginBottom: '16px',
              lineHeight: '1.6'
            },
            'ul, ol': {
              marginBottom: '16px',
              paddingLeft: '24px'
            },
            'li': {
              marginBottom: '8px'
            },
            'img': {
              width: '100%',
              height: 'auto',
              marginBottom: '8px'
            },
            'a': {
              color: '#646cff'
            }
            ,
            'pre': {
              background: '#2b303b',
              color: '#fff',
              padding: '16px',
              borderRadius: '4px',
              overflowX: 'auto',
              marginBottom: '16px'
            }
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </Box>
      </Box>
    </Box>
  );
};
