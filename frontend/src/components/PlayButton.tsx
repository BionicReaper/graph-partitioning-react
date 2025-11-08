import { useState } from 'react';
import { Box, IconButton, Text } from '@chakra-ui/react';
import { Play, ChevronDown } from 'lucide-react';

interface AlgorithmOption {
  id: string;
  name: string;
  description?: string;
}

interface PlayButtonProps {
  onRun: () => void;
  onSelectAlgorithm: (algorithmId: string) => void;
  algorithms: AlgorithmOption[];
  currentAlgorithmId: string;
  disabled?: boolean;
}

const PlayButton = ({
  onRun,
  onSelectAlgorithm,
  algorithms,
  currentAlgorithmId,
  disabled = false
}: PlayButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentAlgorithm = algorithms.find(alg => alg.id === currentAlgorithmId);

  const handleAlgorithmClick = (algorithmId: string) => {
    onSelectAlgorithm(algorithmId);
    setShowDropdown(false);
  };

  const handlePlayClick = () => {
    if (!disabled) {
      onRun();
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <Box
      position="fixed"
      bottom="260px"
      right="20px"
      zIndex={1001}
      onMouseEnter={() => !disabled && setIsExpanded(true)}
      onMouseLeave={() => {
        if (!showDropdown) {
          setIsExpanded(false);
        }
      }}
    >
      {/* Dropdown Menu */}
      {showDropdown && (
        <Box
          position="absolute"
          bottom="70px"
          right="0"
          w="220px"
          bg="white"
          borderRadius="xl"
          boxShadow="lg"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.200"
        >
          {algorithms.map((algorithm) => (
            <Box
              key={algorithm.id}
              px={4}
              py={3}
              cursor="pointer"
              borderBottom="1px solid"
              borderColor="gray.100"
              _last={{ borderBottom: 'none' }}
              bg={algorithm.id === currentAlgorithmId ? 'purple.50' : 'white'}
              _hover={{
                bg: 'purple.50',
                color: 'purple.700',
              }}
              transition="all 0.2s"
              onClick={() => handleAlgorithmClick(algorithm.id)}
            >
              <Text fontSize="sm" fontWeight="500">
                {algorithm.name}
              </Text>
              {algorithm.description && (
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {algorithm.description}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Main Button Container - Pill Shape */}
      <Box
        display="flex"
        alignItems="center"
        h="60px"
        bg={disabled ? 'gray.400' : 'purple.600'}
        borderRadius="full"
        boxShadow="lg"
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        w={isExpanded ? '230px' : '60px'}
      >
        {/* Algorithm Name Section (extends to left) */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          px={4}
          h="full"
          w={"230px"}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          onClick={toggleDropdown}
          opacity={isExpanded ? 1 : 0}
          visibility={isExpanded ? 'visible' : 'hidden'}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            bg: disabled ? 'transparent' : 'purple.700',
          }}
          whiteSpace="nowrap"
        >
          <Text
            color={"white"}
            fontSize="sm"
            fontWeight="500"
          >
            {currentAlgorithm?.name || 'Select Algorithm'}
          </Text>
          <ChevronDown
            size={16}
            color="white"
            style={{
              transition: 'transform 0.2s',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </Box>

        {/* Play Button Circle (stays on right) */}
        <IconButton
          position={"absolute"}
          right={0}
          w="60px"
          h="60px"
          rounded={"full"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={disabled ? 'not-allowed' : 'pointer'}
          flexShrink={0}
          onClick={handlePlayClick}
          _hover={{
            bg: disabled ? 'transparent' : 'purple.700',
          }}
          colorPalette={"purple"}
          transition="background 0.2s"
          _active={{
            transform: disabled ? 'none' : 'scale(0.95)',
          }}
        >
          <Play
            size={24}
            fill="white"
            color="white"
            style={{ marginLeft: '3px' }}
          />
        </IconButton>
      </Box>
    </Box >
  );
};

export default PlayButton;
