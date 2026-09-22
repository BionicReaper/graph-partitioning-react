import { Box } from '@chakra-ui/react';
import { Cable, LucideIcon, Maximize, Menu, PersonStanding, Play, Plus, Trash2 } from 'lucide-react';

interface InlineButtonIconProps {
  icon: LucideIcon;
  colorPalette: string;
  shade?: number;
  fill?: boolean;
}

// Letter-sized replica of a floating action button, for use inside text
const InlineButtonIcon = ({ icon: Icon, colorPalette, shade = 500, fill = false }: InlineButtonIconProps) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    verticalAlign="-0.2em"
    w="1.25em"
    h="1.25em"
    rounded="full"
    bg={{ base: `${colorPalette}.${shade}`, _dark: `${colorPalette}.${shade + 100}` }}
    color="white"
    boxShadow="sm"
    mx="0.1em"
  >
    <Icon size="0.75em" strokeWidth={2.5} fill={fill ? 'white' : 'none'} />
  </Box>
);

// Replicas of the app's floating buttons, referenced by tag name (e.g. <plus/>) in translation strings
export const inlineButtons = {
  plus: <InlineButtonIcon icon={Plus} colorPalette="green" />,
  cable: <InlineButtonIcon icon={Cable} colorPalette="teal" />,
  play: <InlineButtonIcon icon={Play} colorPalette="purple" shade={600} fill />,
  trash: <InlineButtonIcon icon={Trash2} colorPalette="red" />,
  accessibility: <InlineButtonIcon icon={PersonStanding} colorPalette="blue" shade={800} />,
  fullscreen: <InlineButtonIcon icon={Maximize} colorPalette="cyan" />,
  menu: <InlineButtonIcon icon={Menu} colorPalette="blue" shade={600} />,
};

export default InlineButtonIcon;
