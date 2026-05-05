import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface AnchorNavigationButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  verticalPosition?: 'top' | 'middle' | 'bottom';
  horizontalPosition: 'left' | 'right';
  colorPalette?: string;
  disabled?: boolean;
}

const verticalPositionMap = {
  top: '180px',
  middle: '100px',
  bottom: '20px',
};

const horizontalPositionMap = {
  left: '100px',
  right: '20px',
};

const AnchorNavigationButton = ({
  onClick,
  icon: Icon,
  label,
  verticalPosition = 'bottom',
  horizontalPosition,
  colorPalette = 'orange',
  disabled = false,
}: AnchorNavigationButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      position="fixed"
      bottom={disabled ? "-160px" : verticalPositionMap[verticalPosition]}
      right={horizontalPositionMap[horizontalPosition]}
      size={'lg'}
      w={'60px'}
      h={'60px'}
      colorPalette={colorPalette}
      bg={`${colorPalette}.500`}
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
        bg: `${colorPalette}.600`,
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.3s ease, bottom 1s ease"
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

export default AnchorNavigationButton;
