import { Box, Container, Icon, Link, Stack, Text } from '@chakra-ui/react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { IoMdMail } from 'react-icons/io';
import { SiSlack } from "react-icons/si";
import { Link as RouterLink } from 'react-router-dom';

const FOOTER_ITEMS = [
  { label: 'Code of Conduct', href: '/community/code-of-conduct' },
  { label: 'FAQ', href: '/community/faq' },
];

const SOCIAL_LINKS = [
  { label: 'Slack', href: 'https://valkey-oss-developer.slack.com/join/shared_invite/zt-2nxs51chx-EB9hu9Qdch3GMfRcztTSkQ#/shared-invite/email', icon: SiSlack, isExternal: true },
  { label: 'GitHub', href: 'https://github.com/valkey-io', icon: FaGithub, isExternal: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/valkey/', icon: FaLinkedin, isExternal: true },
  { label: 'Twitter', href: 'https://x.com/valkey_io', icon: FaTwitter, isExternal: true },
  { label: 'Connect', href: '/connect', icon: IoMdMail, isExternal: false },
];

export const Footer = () => {

  return (
    <Box 
      as="footer" 
      py={5} 
      mt="auto" 
      bg={'#1A2026'} 
      position={{ 
        base: 'relative',
      }}
      bottom={0} 
      width="100%"
    >
      <Container maxW="none">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="space-between"
          align="center"
        >
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            {SOCIAL_LINKS.map(item => (
              item.isExternal ? (
                <Link
                  key={item.label}
                  href={item.href}
                  isExternal
                  color="white"
                  _hover={{ color: '#ccc' }}
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  fontSize="sm"
                >
                  <Icon as={item.icon} boxSize={5} />
                  <Text>{item.label}</Text>
                </Link>
              ) : (
                <Link
                  key={item.label}
                  as={RouterLink}
                  to={item.href}
                  color="white"
                  _hover={{ color: '#ccc' }}
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  fontSize="sm"
                >
                  <Icon as={item.icon} boxSize={5} />
                  <Text>{item.label}</Text>
                </Link>
              )
            ))}
          </Stack>
          <Stack direction="row" spacing={6}>
            {FOOTER_ITEMS.map(item => (
              <Link
                key={item.label}
                as={RouterLink}
                to={item.href}
                fontSize="sm"
                color="white"
                textDecor={'underline'}
                _hover={{ color: '#ccc' }}
              >
                {item.label}
              </Link>
            ))}
          </Stack>
        </Stack>
        <Box 
          mt={8} 
          pt={4} 
          pb={4}
          borderTop="1px solid" 
          borderColor="whiteAlpha.200"
          textAlign="center"
          
        >
          <Stack spacing={2} mt={4} maxW={'720px'} mx={'auto'}>
            <Text color="whiteAlpha.800" fontSize="md">
              © Valkey contributors, 2024.
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              Valkey and the Valkey logo are trademarks of LF Projects, LLC.
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              <Link href="https://lfprojects.org/policies/trademark-policy/" isExternal color="text.link" _hover={{ color: '#ccc' }}>Trademark Policy</Link>.{' '}
              <Link href="/privacy-policy" color="text.link" _hover={{ color: '#ccc' }}>Privacy Policy</Link>.{' '}
              <Link href="/terms-of-service" color="text.link" _hover={{ color: '#ccc' }}>Terms of Use</Link>.{' '}
              For other policies, please see <Link href="https://lfprojects.org/policies/" isExternal color="text.link" _hover={{ color: '#ccc' }}>lfprojects.org</Link>.
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              Valkey includes certain 3-Clause BSD-licensed Redis code from Redis Ltd. and other source code. Redis Ltd. is not the source of that other source code. Redis is a registered trademark of Redis Ltd.
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              Logo design by <Link href='https://github.com/dizys' isExternal color="text.link">Ziyang.</Link>
            </Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
