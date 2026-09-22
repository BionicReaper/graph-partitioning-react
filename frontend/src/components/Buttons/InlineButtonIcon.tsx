import { Box } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface InlineButtonIconProps {
  icon: LucideIcon;
  colorPalette: string;
  fill?: boolean;
}

// Letter-sized replica of a floating action button, for use inside text
const InlineButtonIcon = ({ icon: Icon, colorPalette, fill = false }: InlineButtonIconProps) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    verticalAlign="-0.2em"
    w="1.25em"
    h="1.25em"
    rounded="full"
    bg={{ base: `${colorPalette}.500`, _dark: `${colorPalette}.600` }}
    color="white"
    boxShadow="sm"
    mx="0.1em"
  >
    <Icon size="0.75em" strokeWidth={2.5} fill={fill ? 'white' : 'none'} />
  </Box>
);

export default InlineButtonIcon;
