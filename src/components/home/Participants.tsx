import { Box, Container, Heading, Image, Stack, Text } from '@chakra-ui/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { participants } from '../../data/participants';

export const Participants = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    draggable: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
    dotsClass: 'slick-dots custom-dots',
  };

  return (
    <Box
      as="section"
      pb={{ base: '4rem', md: '8rem' }}
      bgGradient="linear(to-b, #6983FF, #30176E)"
      sx={{
        '.custom-dots li button:before': {
          color: 'white',
          opacity: 0.5,
        },
        '.custom-dots li.slick-active button:before': {
          color: 'white',
          opacity: 1,
        },
      }}
    >
      <Container maxW="7xl" id="Participants">
        <Stack spacing={12}>
          <Stack spacing={4} textAlign="center">
            <Heading as="h2" fontSize={{ base: "32px", md: "60px" }} color={'#ffffff'}>
              Participants
            </Heading>
            <Text fontSize="lg" color="white" maxW="3xl" mx="auto">
              The Valkey project participants are a diverse group of organizations that have come
              together to maintain and contribute to the project. Valkey participants are more than
              vendors, they are dedicated to continuously strengthening the long-term health and
              viability of this project so that everyone can benefit from it. Since its inception
              Valkey has enjoyed steady adoption demonstrating the industry's desire for an open,
              community-driven database solution. We look forward to seeing our list of participants
              grow as more companies work on our project.
            </Text>
          </Stack>

          <Box pt={6} bg="white" borderRadius={'20px'} px={4}>
            <Slider {...settings}>
              {participants.map(participant => (
                <Box key={participant.name} p={6} textAlign={'center'}>
                  <Image
                    src={participant.logo}
                    alt={participant.name}
                    maxH="40px"
                    mx={'auto'}
                    mb={'6'}
                    objectFit="contain"
                  />
                  <Text color={'#072150'} fontSize={'16px'} fontWeight={'bold'} mb={'1'}>
                    {participant.name}
                  </Text>
                  <Text color={'#353535'} fontSize={'14px'} fontWeight={'400'}>
                    {participant.desc}
                  </Text>
                </Box>
              ))}
            </Slider>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
