import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface InfoButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  verticalPosition?: 'top' | 'middle' | 'bottom';
  horizontalPosition?: 'left' | 'right';
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

const InfoButton = ({
  onClick,
  icon: Icon,
  label,
  verticalPosition = 'middle',
  horizontalPosition = 'right',
  colorPalette = 'orange',
  disabled = false,
}: InfoButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      position="fixed"
      bottom={disabled ? "-80px" : verticalPositionMap[verticalPosition]}
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

export default InfoButton;
