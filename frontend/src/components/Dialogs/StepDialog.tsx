import { CloseButton, Dialog } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface StepDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  anchor: { index: number, textKey: string, values: {[key: string]: string}, firstReach: boolean } | null;
  algorithmId: string;
}

const algorithmMap: { [key: string]: string } = {
  "kernighan-lin": "Kernighan-Lin",
  "fiduccia-mattheyses": "Fiduccia-Mattheyses",
  "metis": "METIS",
};

const StepDialog = ({ isOpen, onOpenChange, anchor, algorithmId }: StepDialogProps) => {
  const { t } = useTranslation();

  const textValue = anchor
    ? anchor.values
        ? t(anchor.textKey, anchor.values)
        : t(anchor.textKey)
    : t('AlgorithmStepInfo');

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange} placement={"center"} motionPreset={"slide-in-bottom"} size={"xl"}>
      <Dialog.Backdrop
        bg="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(2px)"
      />
      <Dialog.Positioner>
        <Dialog.Content
          bg="white"
          p={6}
          gap={6}
          rounded="md"
          shadow="lg"
          overflowY="auto"
          maxHeight="95vh"
        >
          <Dialog.Header>
            <Dialog.CloseTrigger asChild top={4} right={4}>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Title fontSize="2xl" mb={2}>{algorithmMap[algorithmId] || algorithmId}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Description fontSize="md">{textValue}</Dialog.Description>

        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default StepDialog;