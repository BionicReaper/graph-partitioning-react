import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface AddButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  position: 'top' | 'middle' | 'bottom';
  colorPalette?: string;
  active?: boolean;
  disabled?: boolean;
}

const positionMap = {
  top: '180px',
  middle: '100px',
  bottom: '20px',
};

const AddButton = ({
  onClick,
  icon: Icon,
  label,
  position,
  colorPalette = 'green',
  active = false,
  disabled = false,
}: AddButtonProps) => {
  return (
    <IconButton
      onClick={onClick}
      position="fixed"
      bottom={positionMap[position]}
      right="20px"
      size={active ? 'xl' : 'lg'}
      w={active ? '70px' : '60px'}
      h={active ? '70px' : '60px'}
      colorPalette={colorPalette}
      bg={active ? `${colorPalette}.600` : `${colorPalette}.500`}
      rounded="full"
      boxShadow={active ? 'xl' : 'lg'}
      zIndex={1000}
      aria-label={label}
      border={active ? '3px solid' : 'none'}
      borderColor={active ? `${colorPalette}.200` : 'transparent'}
      disabled={disabled}
      _hover={{
        transform: active ? 'scale(1.02)' : 'scale(1.05)',
        boxShadow: '2xl',
        bg: `${colorPalette}.600`,
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.3s ease"
      animation={active ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'}
    >
      <Icon
        size={active ? 28 : 20}
        strokeWidth={active ? 3 : 2}
        style={{
          transition: 'all 0.3s ease',
          filter: active ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' : 'none'
        }}
      />
    </IconButton>
  );
};

export default AddButton;
