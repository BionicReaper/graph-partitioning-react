import { IconButton } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface CancelButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  colorPalette?: string;
  disabled?: boolean;
  dataTour?: string;
}

const CancelButton = ({
  onClick,
  icon: Icon,
  label,
  colorPalette = 'red',
  disabled = false,
  dataTour,
}: CancelButtonProps) => {
  return (
    <IconButton
      data-tour={dataTour}
      onClick={onClick}
      position="fixed"
      bottom={disabled ? "-160px" : "20px"}
      right="180px"
      size={'lg'}
      w={'60px'}
      h={'60px'}
      colorPalette={colorPalette}
      bg={`${colorPalette}.500`}
      color={'white'}
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
      _dark={{
        bg: `${colorPalette}.600`,
        _hover: { bg: `${colorPalette}.700` },
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

export default CancelButton;
