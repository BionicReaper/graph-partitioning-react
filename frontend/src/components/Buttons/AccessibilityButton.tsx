import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface AccessibilityButtonProps {
  icon: LucideIcon;
  label: string;
  position: 'top' | 'middle' | 'bottom';
  colorPalette?: string;
}

const positionMap = {
  top: '180px',
  middle: '100px',
  bottom: '20px',
};

const openAccessibilityMenu = () => {
  document.querySelector<HTMLElement>('.editorim-sidebox-open')?.click();
};

const AccessibilityButton = ({
  icon: Icon,
  label,
  position,
  colorPalette = 'purple',
}: AccessibilityButtonProps) => {
  return (
    <IconButton
      onClick={openAccessibilityMenu}
      position="fixed"
      bottom={positionMap[position]}
      left="20px"
      size={'lg'}
      w={'60px'}
      h={'60px'}
      colorPalette={colorPalette}
      bg={`${colorPalette}.800`}
      rounded="full"
      boxShadow={'lg'}
      zIndex={1000}
      aria-label={label}
      border={'none'}
      borderColor={'transparent'}
      _hover={{
        transform: 'scale(1.05)',
        boxShadow: '2xl',
        bg: `${colorPalette}.600`,
      }}
      _dark={{
        bg: `${colorPalette}.700`,
        _hover: { bg: `${colorPalette}.500` },
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.3s ease"
      animation={'none'}
      opacity={0.7}
    >
      <Icon
        size={20}
        strokeWidth={2}
        style={{
          transition: 'all 0.3s ease',
          filter: 'none'
        }}
      />
    </IconButton>
  );
};

export default AccessibilityButton;
