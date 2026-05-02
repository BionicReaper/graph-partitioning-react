import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface FullscreenButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  position: 'top' | 'middle' | 'bottom';
  colorPalette?: string;
  fullscreenColorPalette?: string;
  isFullscreen?: boolean;
  disabled?: boolean;
}

const positionMap = {
  top: '180px',
  middle: '100px',
  bottom: '20px',
};

const FullscreenButton = ({
  onClick,
  icon: Icon,
  label,
  position,
  colorPalette = 'green',
  fullscreenColorPalette = 'green',
  isFullscreen = false,
  disabled = false,
}: FullscreenButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      position="fixed"
      bottom={positionMap[position]}
      right={disabled ? "-80px" : "20px"}
      size={'lg'}
      w={'60px'}
      h={'60px'}
      colorPalette={colorPalette}
      bg={isFullscreen ? `${fullscreenColorPalette}.600` : `${colorPalette}.500`}
      rounded="full"
      boxShadow={'lg'}
      zIndex={1000}
      aria-label={label}
      border={'none'}
      borderColor={'transparent'}
      disabled={disabled}
      _hover={{
        transform: 'scale(1.05)',
        boxShadow: '2xl',
        bg: isFullscreen ? `${fullscreenColorPalette}.600` : `${colorPalette}.600`,
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.3s ease, right 1s ease"
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

export default FullscreenButton;
