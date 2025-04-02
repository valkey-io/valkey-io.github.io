import { Box, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, HStack, IconButton, Image, Link, useDisclosure, VStack } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import ValkeyHorLogo from '/src/assets/images/valkey-horizontal-color.svg';

interface NavItem {
  label: string;
  href: string;
  isHashLink?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Download', href: '/download' },
  { label: 'Documentation', href: '/topics' },
  { label: 'Command Reference', href: '/commands' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
  { label: 'Participants', href: '/participants' },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1); // Remove the # from the href

    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If we're already on the home page, just scroll
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Box
      as="nav"
      position="fixed"
      w="100%"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      zIndex="sticky"
    >
      <Flex mx="auto" px={4} h={'80px'} alignItems="center" justifyContent="space-between">
        <Link as={RouterLink} to="/" variant="logo">
          <Image h={'46px'} w={'150px'} src={ValkeyHorLogo} alt="Valkey.io" />
        </Link>

        {/* Desktop Navigation */}
        <HStack spacing={8} display={{ base: 'none', lg: 'flex' }}>
          {NAV_ITEMS.map(item =>
            item.isHashLink ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={e => handleHashLinkClick(e, item.href)}
                variant="nav"
                fontSize={'16px'}
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                as={RouterLink}
                to={item.href}
                variant="nav"
                aria-current={location.pathname === item.href ? 'page' : undefined}
                fontSize={'16px'}
              >
                {item.label}
              </Link>
            )
          )}
        </HStack>

        {/* Mobile Navigation Button */}
        <IconButton
          display={{ base: 'flex', lg: 'none' }}
          onClick={onOpen}
          icon={<FiMenu size={24} />}
          variant="ghost"
          aria-label="Open Menu"
          outline={'none'}
          _focus={{
            outline: 'none',
          }}
        />

        {/* Mobile Navigation Drawer */}
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton
              outline={'none'}
              _focus={{
                outline: 'none',
              }}
            />
            <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
            <DrawerBody>
              <VStack spacing={4} align="start" pt={4}>
                {NAV_ITEMS.map(item =>
                  item.isHashLink ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        handleHashLinkClick(e, item.href);
                        onClose();
                      }}
                      variant="nav"
                      fontSize={'16px'}
                      w="100%"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      key={item.label}
                      as={RouterLink}
                      to={item.href}
                      variant="nav"
                      aria-current={location.pathname === item.href ? 'page' : undefined}
                      fontSize={'16px'}
                      w="100%"
                      onClick={onClose}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Box>
  );
};
