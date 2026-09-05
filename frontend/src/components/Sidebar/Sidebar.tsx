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
  HStack,
  NumberInput,
  Slider,
  Button
} from '@chakra-ui/react';
import { Menu, GitBranch, Globe, Waypoints, ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AlgorithmDialog from '../Dialogs/AlgorithmDialog';
import { graphGenerationModeLabelKeys, graphGenerationModes, stepSettingLabelKeys, stepSettingModes, type GraphGenerationMode, type StepSettingMode } from '../../utils/constants';
import type { GraphGenerationOptions } from '../../utils/graphGeneration';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useColorMode } from '../../hooks/useColorMode';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  disablePhysicsToggle?: boolean;
  physicsEnabled: boolean;
  onTogglePhysics: () => void;
  onGenerateGraph: (options: GraphGenerationOptions) => void;
  disableGraphGeneration?: boolean;
  algorithmPasses: number;
  onAlgorithmPassesChange: (value: number) => void;
  disableAlgorithmPassesChange?: boolean;
  shouldOpenStepDialog: StepSettingMode;
  onShouldOpenStepDialogChange: (value: StepSettingMode) => void;
  shouldPause: StepSettingMode;
  onShouldPauseChange: (value: StepSettingMode) => void;
}

const algorithms = [
  'Kernighan-Lin',
  'Fiduccia-Mattheyses',
  'METIS',
];

const panelBg = { base: 'white', _dark: 'gray.900' };
const cardBg = { base: 'gray.50', _dark: 'gray.800' };
const headingColor = { base: 'gray.800', _dark: 'gray.100' };
const bodyColor = { base: 'gray.700', _dark: 'gray.200' };
const mutedColor = { base: 'gray.600', _dark: 'gray.400' };
const dividerColor = { base: 'gray.200', _dark: 'gray.700' };
const accentColor = { base: 'blue.600', _dark: 'blue.300' };

const nativeLanguageLabels: Record<string, string> = {
  en: 'English',
  el: 'Ελληνικά'
};

const Sidebar = ({
  isOpen,
  onToggle,
  disablePhysicsToggle = false,
  physicsEnabled,
  onTogglePhysics,
  onGenerateGraph,
  disableGraphGeneration = false,
  algorithmPasses,
  onAlgorithmPassesChange,
  disableAlgorithmPassesChange = false,
  shouldOpenStepDialog,
  onShouldOpenStepDialogChange,
  shouldPause,
  onShouldPauseChange
}: SidebarProps) => {
  const { t, i18n } = useTranslation();

  const { isDarkMode, toggleDarkMode } = useColorMode();

  const [dialogState, setDialogState] = useState<{ isOpen: boolean; algorithm: string | null }>({
    isOpen: false,
    algorithm: null,
  });

  const [graphGenerationMode, setGraphGenerationMode] = useLocalStorage<GraphGenerationMode>('graphGenerationMode', 'uniform');
  const [nodeCount, setNodeCount] = useLocalStorage<number>('nodeCount', 10);
  const [edgeChance, setEdgeChance] = useLocalStorage<number>('edgeChance', 30); // percentage 0-100
  const [regionANodes, setRegionANodes] = useLocalStorage<number>('regionANodes', 5);
  const [regionBNodes, setRegionBNodes] = useLocalStorage<number>('regionBNodes', 5);
  const [intraRegionEdgeChance, setIntraRegionEdgeChance] = useLocalStorage<number>('intraRegionEdgeChance', 60); // percentage 0-100
  const [interRegionEdgeChance, setInterRegionEdgeChance] = useLocalStorage<number>('interRegionEdgeChance', 5); // percentage 0-100

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
        _dark={{
          bg: 'blue.700',
          _hover: { bg: 'blue.800' },
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
          bg={panelBg}
          boxShadow="2px 0 10px rgba(0, 0, 0, 0.1)"
        >
          {/* Algorithm Description Dialog */}
          <AlgorithmDialog
            isOpen={dialogState.isOpen}
            onOpenChange={() => setDialogState((prev) => ({ isOpen: false, algorithm: prev.algorithm }))}
            algorithm={dialogState.algorithm || ''}
          />
          <Drawer.CloseTrigger
            top="4"
            right="4"
          />
          <Drawer.Header
            borderBottomWidth="2px"
            borderBottomColor={dividerColor}
            pt={8}
            pb={4}
            px={5}
          >
            <Heading size="xl" color={accentColor} fontWeight="600">
              {t('GraphPartitioning')}
            </Heading>
          </Drawer.Header>

          <Drawer.Body px={5} py={8}>
            <VStack gap={8} align="stretch">
              {/* Algorithms Section */}
              <Box>
                <Heading size="lg" mb={4} color={headingColor} fontWeight="500">
                  {t('Algorithms')}
                </Heading>
                <Stack gap={2}>
                  {algorithms.map((algorithm) => (
                    <Box
                      key={algorithm}
                      p={3}
                      bg={cardBg}
                      borderRadius="md"
                      cursor="pointer"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      color={bodyColor}
                      _hover={{
                        bg: { base: 'blue.50', _dark: 'blue.900' },
                        color: { base: 'blue.600', _dark: 'blue.200' },
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

              <Separator borderColor={dividerColor} />

              {/* Graph Generation Section */}
              <Box>
                <Heading size="lg" mb={4} color={headingColor} fontWeight="500">
                  {t('GraphGeneration')} <Waypoints size={20} style={{ display: 'inline', marginLeft: '4px' }} />
                </Heading>
                <VStack gap={4} align="stretch">
                  <Box p={3} bg={cardBg} borderRadius="md">
                    <RadioGroup.Root
                      value={graphGenerationMode}
                      onValueChange={(e) => e.value && setGraphGenerationMode(e.value as GraphGenerationMode)}
                      colorPalette={"blue"}
                    >
                      <VStack align="start" gap={2}>
                        {graphGenerationModes.map((mode) => (
                          <RadioGroup.Item key={mode} value={mode}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText fontSize="sm" color={bodyColor}>
                              {t(graphGenerationModeLabelKeys[mode])}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </VStack>
                    </RadioGroup.Root>
                  </Box>

                  {graphGenerationMode === 'uniform' ? (
                    <>
                      <Box p={3} bg={cardBg} borderRadius="md">
                        <Text fontSize="sm" color={bodyColor} fontWeight="500" mb={2}>
                          {t('NodeCount')}
                        </Text>
                        <NumberInput.Root
                          value={String(nodeCount)}
                          min={1}
                          step={1}
                          width="100%"
                          size="sm"
                          onValueChange={(e) => setNodeCount(Number.isNaN(e.valueAsNumber) ? 1 : Math.max(1, Math.floor(e.valueAsNumber)))}
                        >
                          <NumberInput.Control />
                          <NumberInput.Input />
                        </NumberInput.Root>
                      </Box>

                      <Box p={3} bg={cardBg} borderRadius="md">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontSize="sm" color={bodyColor} fontWeight="500">
                            {t('EdgeChance')}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} fontWeight="500">
                            {edgeChance}%
                          </Text>
                        </HStack>
                        <Slider.Root
                          value={[edgeChance]}
                          min={0}
                          max={100}
                          step={0.01}
                          colorPalette="blue"
                          onValueChange={(e) => setEdgeChance(e.value[0])}
                        >
                          <Slider.Control>
                            <Slider.Track>
                              <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumbs />
                          </Slider.Control>
                        </Slider.Root>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box p={3} bg={cardBg} borderRadius="md">
                        <Text fontSize="sm" color={bodyColor} fontWeight="500" mb={2}>
                          {t('RegionANodeCount')}
                        </Text>
                        <NumberInput.Root
                          value={String(regionANodes)}
                          min={1}
                          step={1}
                          width="100%"
                          size="sm"
                          onValueChange={(e) => setRegionANodes(Number.isNaN(e.valueAsNumber) ? 1 : Math.max(1, Math.floor(e.valueAsNumber)))}
                        >
                          <NumberInput.Control />
                          <NumberInput.Input />
                        </NumberInput.Root>
                      </Box>

                      <Box p={3} bg={cardBg} borderRadius="md">
                        <Text fontSize="sm" color={bodyColor} fontWeight="500" mb={2}>
                          {t('RegionBNodeCount')}
                        </Text>
                        <NumberInput.Root
                          value={String(regionBNodes)}
                          min={1}
                          step={1}
                          width="100%"
                          size="sm"
                          onValueChange={(e) => setRegionBNodes(Number.isNaN(e.valueAsNumber) ? 1 : Math.max(1, Math.floor(e.valueAsNumber)))}
                        >
                          <NumberInput.Control />
                          <NumberInput.Input />
                        </NumberInput.Root>
                      </Box>

                      <Box p={3} bg={cardBg} borderRadius="md">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontSize="sm" color={bodyColor} fontWeight="500">
                            {t('IntraRegionEdgeChance')}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} fontWeight="500">
                            {intraRegionEdgeChance}%
                          </Text>
                        </HStack>
                        <Slider.Root
                          value={[intraRegionEdgeChance]}
                          min={0}
                          max={100}
                          step={0.01}
                          colorPalette="blue"
                          onValueChange={(e) => setIntraRegionEdgeChance(e.value[0])}
                        >
                          <Slider.Control>
                            <Slider.Track>
                              <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumbs />
                          </Slider.Control>
                        </Slider.Root>
                      </Box>

                      <Box p={3} bg={cardBg} borderRadius="md">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontSize="sm" color={bodyColor} fontWeight="500">
                            {t('InterRegionEdgeChance')}
                          </Text>
                          <Text fontSize="sm" color={mutedColor} fontWeight="500">
                            {interRegionEdgeChance}%
                          </Text>
                        </HStack>
                        <Slider.Root
                          value={[interRegionEdgeChance]}
                          min={0}
                          max={100}
                          step={0.01}
                          colorPalette="blue"
                          onValueChange={(e) => setInterRegionEdgeChance(e.value[0])}
                        >
                          <Slider.Control>
                            <Slider.Track>
                              <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumbs />
                          </Slider.Control>
                        </Slider.Root>
                      </Box>
                    </>
                  )}

                  <Button
                    colorPalette="blue"
                    onClick={() => onGenerateGraph(
                      (graphGenerationMode === 'regions')
                        ? {
                          mode: 'regions',
                          regionNodeCounts: [regionANodes, regionBNodes],
                          intraRegionProbability: intraRegionEdgeChance / 100,
                          interRegionProbability: interRegionEdgeChance / 100
                        }
                        : {
                          mode: 'uniform',
                          nodeCount,
                          edgeProbability: edgeChance / 100
                        }
                    )}
                    disabled={disableGraphGeneration}
                  >
                    {t('GenerateGraph')}
                  </Button>
                </VStack>
              </Box>

              <Separator borderColor={dividerColor} />

              {/* Settings Section */}
              <Box>
                <Heading size="lg" mb={4} color={headingColor} fontWeight="500">
                  {t('Settings')}
                </Heading>

                {/* Passes */}
                <Heading size="md" mb={4} mt={6} color={headingColor} fontWeight="500">
                  {t('Passes')}
                </Heading>
                <Box
                  p={3}
                  bg={cardBg}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <IconButton
                    aria-label={t('DecreasePasses')}
                    size="sm"
                    variant="ghost"
                    color={bodyColor}
                    onClick={() => onAlgorithmPassesChange(Math.max(0, algorithmPasses - 1))}
                    disabled={algorithmPasses <= 0 || disableAlgorithmPassesChange}
                  >
                    <ChevronLeft size={18} />
                  </IconButton>
                  <Text fontSize="sm" color={bodyColor} fontWeight="500" textAlign="center">
                    {algorithmPasses === 0 ? t('PassesUntilNoGain') : algorithmPasses}
                  </Text>
                  <IconButton
                    aria-label={t('IncreasePasses')}
                    size="sm"
                    variant="ghost"
                    color={bodyColor}
                    onClick={() => onAlgorithmPassesChange(algorithmPasses + 1)}
                    disabled={disableAlgorithmPassesChange}
                  >
                    <ChevronRight size={18} />
                  </IconButton>
                </Box>

                <Heading size="md" mb={4} mt={6} color={headingColor} fontWeight="500">
                  {t('Graph')}
                </Heading>

                {/* Physics Toggle */}
                <Box
                  p={3}
                  bg={cardBg}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="sm" color={bodyColor} fontWeight="500">
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

                <Heading size="md" mb={4} mt={6} color={headingColor} fontWeight="500">
                  {t('Appearance')} <Moon size={20} style={{ display: 'inline', marginLeft: '4px' }} />
                </Heading>

                <Box
                  p={3}
                  bg={cardBg}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="sm" color={bodyColor} fontWeight="500">
                    {t('DarkMode')}
                  </Text>
                  <Switch.Root
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label />
                  </Switch.Root>
                </Box>

                <Heading size="md" mb={4} mt={6} color={headingColor} fontWeight="500">
                  {t('Language')} <Globe size={20} style={{ display: 'inline', marginLeft: '4px' }} />
                </Heading>

                {/* Language Select */}
                <Box
                  p={3}
                  px={6}
                  bg={cardBg}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <RadioGroup.Root
                    value={i18n.language}
                    onValueChange={(e) => i18n.changeLanguage(e.value || undefined)}
                    w={"100%"}
                    colorPalette={"blue"}
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

                {/* Info settings */}

                <Heading size="md" mb={4} mt={6} color={headingColor} fontWeight="500">
                  {t('InfoSettings')}
                </Heading>

                {/* When to open the step explanation dialog */}
                <Box
                  p={3}
                  bg={cardBg}
                  borderRadius="md"
                >
                  <Text fontSize="sm" color={bodyColor} fontWeight="500" mb={3}>
                    {t('OpenStepDialog')}
                  </Text>
                  <RadioGroup.Root
                    value={shouldOpenStepDialog}
                    onValueChange={(e) => e.value && onShouldOpenStepDialogChange(e.value as StepSettingMode)}
                    colorPalette={"blue"}
                  >
                    <VStack align="start" gap={2}>
                      {stepSettingModes.map((mode) => (
                        <RadioGroup.Item key={mode} value={mode}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText fontSize="sm" color={bodyColor}>
                            {t(stepSettingLabelKeys[mode])}
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </VStack>
                  </RadioGroup.Root>
                </Box>

                {/* When to pause playback on a step */}
                <Box
                  p={3}
                  mt={4}
                  bg={cardBg}
                  borderRadius="md"
                >
                  <Text fontSize="sm" color={bodyColor} fontWeight="500" mb={3}>
                    {t('PauseOnStep')}
                  </Text>
                  <RadioGroup.Root
                    value={shouldPause}
                    onValueChange={(e) => e.value && onShouldPauseChange(e.value as StepSettingMode)}
                    colorPalette={"blue"}
                  >
                    <VStack align="start" gap={2}>
                      {stepSettingModes.map((mode) => (
                        <RadioGroup.Item key={mode} value={mode}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator />
                          <RadioGroup.ItemText fontSize="sm" color={bodyColor}>
                            {t(stepSettingLabelKeys[mode])}
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </VStack>
                  </RadioGroup.Root>
                </Box>
              </Box>

              <Separator borderColor={dividerColor} />

              {/* Controls Section */}
              <Box>
                <Heading size="lg" mb={4} color={headingColor} fontWeight="500">
                  {t('Controls')}
                </Heading>
                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('AddNodeInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('AddEdgeInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('RunAlgorithmInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('SelectRemoveInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('RepositionNodesInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('PanCanvasInstruction')}
                  </Text>
                  <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
                    {t('ZoomInstruction')}
                  </Text>
                </VStack>
              </Box>

              <Separator borderColor={dividerColor} />

              {/* Info Section */}
              <Box>
                <Heading size="lg" mb={4} color={headingColor} fontWeight="500">
                  {t('About')}
                </Heading>
                <Text fontSize="sm" color={mutedColor} lineHeight="1.5">
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
