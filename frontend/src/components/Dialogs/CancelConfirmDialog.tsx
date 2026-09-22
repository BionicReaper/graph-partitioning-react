import { Button, CloseButton, Dialog, HStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface CancelConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelConfirmDialog = ({ isOpen, onClose, onConfirm }: CancelConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} placement={"center"} motionPreset={"slide-in-bottom"} size={"sm"} role="alertdialog">
      <Dialog.Backdrop
        bg="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(2px)"
      />
      <Dialog.Positioner>
        <Dialog.Content
          bg={{ base: 'white', _dark: 'gray.900' }}
          p={6}
          gap={4}
          rounded="md"
          shadow="lg"
        >
          <Dialog.Header>
            <Dialog.CloseTrigger asChild top={4} right={4}>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Title fontSize="xl">{t('CancelAlgorithmConfirmTitle')}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Description fontSize="md">{t('CancelAlgorithmConfirmDescription')}</Dialog.Description>
          <Dialog.Footer>
            <HStack gap={3} justify="flex-end">
              <Button variant="outline" px={4} onClick={onClose}>{t('CancelAlgorithmConfirmNo')}</Button>
              <Button colorPalette="red" px={4} onClick={onConfirm}>{t('CancelAlgorithmConfirmYes')}</Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default CancelConfirmDialog;
