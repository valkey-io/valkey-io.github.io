import { Heading, Link, ListItem, Text, UnorderedList } from '@chakra-ui/react';
import { ComponentPropsWithoutRef } from 'react';


export const StyledH1 = ({ children, ...props }: ComponentPropsWithoutRef<typeof Text>) => (
  <Heading as="h1" color={"#30176E"} fontSize="24px" mb={4} {...props}>{children}</Heading>
);

export const StyledH2 = ({ children, ...props }: ComponentPropsWithoutRef<typeof Text>) => (
  <Heading as="h2" color={"#30176E"} fontSize="16px" mb={4} {...props}>{children}</Heading>
);

export const StyledParagraph = ({ children, ...props }: ComponentPropsWithoutRef<typeof Text>) => (
  <Text mb={4} {...props}>{children}</Text>
);

export const StyledList = ({ children, ...props }: ComponentPropsWithoutRef<typeof UnorderedList>) => (
  <UnorderedList spacing={2} pl={5} mb={6} {...props}>
    {children}
  </UnorderedList>
);

export const StyledListItem = ({ children, ...props }: ComponentPropsWithoutRef<typeof ListItem>) => (
  <ListItem {...props}>{children}</ListItem>
);

export const StyledLink = ({ href, children, ...props }: ComponentPropsWithoutRef<typeof Link>) => (
  <Link href={href} color="blue.500" isExternal {...props}>
    {children}
  </Link>
); 