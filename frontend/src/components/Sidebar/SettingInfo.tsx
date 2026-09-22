import { Box, Portal, Tooltip } from '@chakra-ui/react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingInfoProps {
  textKey: string;
}

const SettingInfo = ({ textKey }: SettingInfoProps) => {
  const { t } = useTranslation();
  const text = t(textKey);

  return (
    <Tooltip.Root openDelay={150} closeDelay={100} positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>
        <Box
          as="span"
          display="inline-flex"
          verticalAlign="middle"
          ml={1.5}
          color={{ base: 'gray.500', _dark: 'gray.400' }}
          cursor="help"
          tabIndex={0}
          aria-label={text}
          _hover={{ color: { base: 'blue.600', _dark: 'blue.300' } }}
          _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', borderRadius: 'sm' }}
        >
          <Info size={14} />
        </Box>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content maxW="260px" fontSize="xs" lineHeight="1.4" px={3} py={2}>
            <Tooltip.Arrow>
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
            {text}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
};

export default SettingInfo;
