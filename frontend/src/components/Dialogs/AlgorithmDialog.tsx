import { Box, CloseButton, Dialog } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface AlgorithmDialogProps {
  isOpen: boolean;
  onOpenChange: () => void;
  algorithm: string;
}

const algorithmTranslationsLabels: Record<string, string> = {
  'Kernighan-Lin': 'KernighanLinFullDescription',
  'Fiduccia-Mattheyses': 'FiducciaMattheysesFullDescription',
  'METIS': 'METISFullDescription',
};

const algorithmPseudocodeTranslationsLabels: Record<string, string> = {
  'Kernighan-Lin': 'KernighanLinPseudocode',
  'Fiduccia-Mattheyses': 'FiducciaMattheysesPseudocode',
  'METIS': 'METISPseudocode',
};

const AlgorithmDialog = ({ isOpen, onOpenChange, algorithm }: AlgorithmDialogProps) => {
  const { t } = useTranslation();

  const algorithmDescriptionKey = algorithmTranslationsLabels[algorithm] || 'AlgorithmDescriptionNotFound';
  const algorithmPseudocodeKey = algorithmPseudocodeTranslationsLabels[algorithm] || 'AlgorithmPseudocodeNotFound';

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
        >
          <Dialog.Header>
            <Dialog.CloseTrigger asChild top={4} right={4}>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Title fontSize="2xl" mb={2}>{algorithm}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Description fontSize="md">{t(algorithmDescriptionKey)}</Dialog.Description>

          {/* Pseudocode Section */}
          <Box>
            <Dialog.Title fontSize="xl" mt={6} mb={4}>{t('Pseudocode')}</Dialog.Title>
            <Box
              as="pre"
              p={4}
              bg="gray.800"
              color="gray.100"
              rounded="md"
              fontSize="sm"
              aria-label="algorithm pseudocode"
              fontFamily="mono"
              overflowX="auto"
            >
              {t(algorithmPseudocodeKey)}
            </Box>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default AlgorithmDialog;