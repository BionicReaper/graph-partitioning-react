import { Popover, Portal, chakra } from '@chakra-ui/react';
import { Info } from 'lucide-react';
import { useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingInfoProps {
  textKey: string;
}

const SettingInfo = ({ textKey }: SettingInfoProps) => {
  const { t } = useTranslation();
  const text = t(textKey);
  const [open, setOpen] = useState(false);

  const onMouseOnly = (value: boolean) => (e: PointerEvent) => {
    if (e.pointerType === 'mouse') setOpen(value);
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: 'top' }}
      autoFocus={false}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <chakra.button
          type="button"
          display="inline-flex"
          verticalAlign="middle"
          p={1}
          m={-1}
          ml={0.5}
          bg="transparent"
          border="none"
          color={{ base: 'gray.500', _dark: 'gray.400' }}
          cursor="help"
          aria-label={text}
          onPointerEnter={onMouseOnly(true)}
          onPointerLeave={onMouseOnly(false)}
          _hover={{ color: { base: 'blue.600', _dark: 'blue.300' } }}
          _focusVisible={{ outline: '2px solid', outlineColor: 'blue.500', borderRadius: 'sm' }}
        >
          <Info size={14} />
        </chakra.button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="260px" w="auto">
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body fontSize="xs" lineHeight="1.4" px={3} py={2}>
              {text}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default SettingInfo;
