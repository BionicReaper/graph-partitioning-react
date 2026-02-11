import {
  IconButton,
  VStack,
  Heading,
  Text,
  Box,
  Separator,
  Stack,
  Drawer,
  Switch
} from '@chakra-ui/react';
import { Menu, GitBranch } from 'lucide-react';

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

const Sidebar = ({ isOpen, onToggle, disablePhysicsToggle = false, physicsEnabled, onTogglePhysics }: SidebarProps) => {
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
        aria-label="Open menu"
        _hover={{
          bg: 'blue.700',
          transform: 'scale(1.05)',
          boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.3s ease"
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
              Graph Partitioning
            </Heading>
          </Drawer.Header>

          <Drawer.Body px={5} py={8}>
            <VStack gap={8} align="stretch">
              {/* Algorithms Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  Algorithms
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
                  Settings
                </Heading>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="sm" color="gray.700" fontWeight="500">
                    Physics
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
              </Box>

              <Separator borderColor="gray.200" />

              {/* Controls Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  Controls
                </Heading>
                <VStack gap={2} align="stretch">
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Press the Plus button or N on your keyboard to get in Add Node Mode and click on the grid to add a node. Press again or switch mode to stop adding nodes.
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Press the Cable button or E on your keyboard to get in Add Edge Mode and drag from one node to another to create an edge. Press again or switch mode to stop adding edges.
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Left click on a node or an edge to select it and DELETE to remove it
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Drag nodes to reposition them
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Drag canvas to pan
                  </Text>
                  <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                    • Scroll to zoom in/out
                  </Text>
                </VStack>
              </Box>

              <Separator borderColor="gray.200" />

              {/* Info Section */}
              <Box>
                <Heading size="md" mb={4} color="gray.800" fontWeight="500">
                  About
                </Heading>
                <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                  This tool helps visualize and understand graph partitioning algorithms
                  used in computer science and network optimization.
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
