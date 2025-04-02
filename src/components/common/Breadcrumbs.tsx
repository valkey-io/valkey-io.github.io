import { Container, Flex, Link, Text } from '@chakra-ui/react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <Flex alignItems={'center'} background="#FAFAFD" h={'44px'}>
      <Container maxW="container.xl">
        <Flex align="center" gap={2}>
          {items.map((item, index) => (
            <Flex key={index} align="center" gap={2}>
              {index > 0 && <Text color="gray.500">&gt;</Text>}
              {item.href ? (
                <Link href={item.href} color="text.link" fontWeight="medium">
                  {item.label}
                </Link>
              ) : (
                <Text color="gray.700">{item.label}</Text>
              )}
            </Flex>
          ))}
        </Flex>
      </Container>
    </Flex>
  );
}; 