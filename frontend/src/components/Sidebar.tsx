import {
  IconButton,
  VStack,
  Heading,
  Text,
  Box,
  Separator,
  Stack,
  Drawer,
  Switch,
  RadioGroup,
  HStack
} from '@chakra-ui/react';
import { Menu, GitBranch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AlgorithmDialog from './AlgorithmDialog';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  disablePhysicsToggle?: boolean;
  physicsEnabled: boolean;
  onTogglePhysics: () => void;
}

const algorithms = [
  'Kernighan-Lin',
  'Fiduccia-Mattheyses',
  'METIS',
];

const nativeLanguageLabels: Record<string, string> = {
  en: 'English',
  el: 'Ελληνικά'
};

const Sidebar = ({ isOpen, onToggle, disablePhysicsToggle = false, physicsEnabled, onTogglePhysics }: SidebarProps) => {
  const { t, i18n } = useTranslation();

  const [dialogState, setDialogState] = useState<{ isOpen: boolean; algorithm: string | null }>({
    isOpen: false,
    algorithm: null,
  });

  const languageOptions = useMemo(() => {
    return i18n.store.data ? Object.keys(i18n.store.data) : [];
  }, [i18n.store.data]);

  return (
    <>
      {/* Hamburger Button - Bottom Left */}
      <IconButton
        onClick={onToggle}
        position="fixed"
        bottom="20px"
        left="20px"
        w="60px"
        h="60px"
        size="lg"
        colorPalette="blue"
        rounded="full"
        bg="blue.600"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)"
        zIndex={1000}
        aria-label={t('ToggleMenu')}
        _hover={{
          bg: 'blue.700',
          transform: 'scale(1.05)',
          boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.3s ease"
        opacity={0.7}
      >
        <Menu size={24} />
      </IconButton>

      {/* Sidebar Drawer */}
      <Drawer.Root open={isOpen} placement="start" onOpenChange={(e) => !e.open && onToggle()}>
        <Drawer.Backdrop
          bg="rgba(0, 0, 0, 0.5)"
          backdropFilter="blur(2px)"
        />
        <Drawer.Content
          height={"100%"}
          maxW="300px"
          bg="white"
          boxShadow="2px 0 10px rgba(0, 0, 0, 0.1)"
        >
          {/* Algorithm Description Dialog */}
          {dialogState.algorithm && (
            <AlgorithmDialog
              isOpen={dialogState.isOpen}
              onOpenChange={() => setDialogState({ isOpen: false, algorithm: null })}
              algorithm={dialogState.algorithm}
            />
          )}
          <Drawer.CloseTrigger
            top="4"
            right="4"
          />
          <Drawer.Header
            borderBottomWidth="2px"
            borderBottomColor="gray.200"
            pt={8}
            pb={4}
            px={5}
          >
            <Heading size="lg" color="blue.600" fontWeight="600">
              {t('GraphPartitioning')}
            </Heading>
          </Drawer.Header>

          <Drawer.Body px={5} py={8}>
            <VStack gap={8} align="stretch">
              {/* Algorithms Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  {t('Algorithms')}
                </Heading>
                <Stack gap={2}>
                  {algorithms.map((algorithm) => (
                    <Box
                      key={algorithm}
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      cursor="pointer"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      color="gray.700"
                      _hover={{
                        bg: 'blue.50',
                        color: 'blue.600',
                        transform: 'translateX(5px)'
                      }}
                      transition="all 0.2s ease"
                      onClick={() => setDialogState({ isOpen: true, algorithm: algorithm })}
                    >
                      <GitBranch size={16} style={{ flexShrink: 0 }} />
                      {algorithm}
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Separator borderColor="gray.200" />

              {/* Settings Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  {t('Settings')}
                </Heading>

                {/* Physics Toggle */}
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="sm" color="gray.700" fontWeight="500">
                    {t('Physics')}
                  </Text>
                  <Switch.Root
                    checked={physicsEnabled}
                    onCheckedChange={onTogglePhysics}
                    disabled={disablePhysicsToggle}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label />
                  </Switch.Root>
                </Box>

                <Heading size="md" mb={4} mt={6} color="gray.800" fontWeight="500">
                  {t('Language')}
                </Heading>

                {/* Language Select */}
                <Box
                  p={3}
                  px={6}
                  bg="gray.50"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <RadioGroup.Root
                    value={i18n.language}
                    onValueChange={(e) => i18n.changeLanguage(e.value || undefined)}
                    w={"100%"}
                  >
                    <HStack gap="6" justifyContent={"space-between"}>
                      {languageOptions.map((language) => (
                        <RadioGroup.Item key={language} value={language}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText>{nativeLanguageLabels[language]}</RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </HStack>
                  </RadioGroup.Root>
                </Box>
              </Box>

              <Separator borderColor="gray.200" />

              {/* Controls Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  {t('Controls')}
                </Heading>
                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('AddNodeInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('AddEdgeInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('RunAlgorithmInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('SelectRemoveInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('RepositionNodesInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('PanCanvasInstruction')}
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    {t('ZoomInstruction')}
                  </Text>
                </VStack>
              </Box>

              <Separator borderColor="gray.200" />

              {/* Info Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  {t('About')}
                </Heading>
                <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                  {t('AboutText')}
                </Text>
              </Box>
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
};

export default Sidebar;
