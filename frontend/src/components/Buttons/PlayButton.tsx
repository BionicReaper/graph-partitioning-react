import { useEffect, useState } from 'react';
import { Box, IconButton, Text } from '@chakra-ui/react';
import { Play, ChevronDown, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AlgorithmOption {
  id: string;
  name: string;
  description?: string;
}

interface PlayButtonProps {
  onRun: () => void;
  onTogglePause: () => void;
  onSelectAlgorithm: (algorithmId: string) => void;
  algorithms: AlgorithmOption[];
  currentAlgorithmId: string;
  isPaused: boolean;
  isRunning: boolean;
  animationStarted: boolean;
}

const PlayButton = ({
  onRun,
  onTogglePause,
  onSelectAlgorithm,
  algorithms,
  currentAlgorithmId,
  isPaused = false,
  isRunning = false,
  animationStarted = false
}: PlayButtonProps) => {
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const currentAlgorithm = algorithms.find(alg => alg.id === currentAlgorithmId);

  const handleAlgorithmClick = (algorithmId: string) => {
    onSelectAlgorithm(algorithmId);
    setShowDropdown(false);
    setIsExpanded(false);
  };

  const handlePlayClick = () => {
    if (!isRunning && !animationStarted && onRun) {
      onRun();
    } else if (isRunning && animationStarted && onTogglePause) {
      onTogglePause();
    }
  };

  const toggleDropdown = () => {
    if (!isRunning && !animationStarted) {
      setShowDropdown(!showDropdown);
    }
  };

  useEffect(() => {
    if (isRunning || animationStarted) {
      setShowDropdown(false);
      setIsExpanded(false);
    }
  }, [isRunning, animationStarted]);

  return (
    <Box
      position="fixed"
      bottom="180px"
      //right={isRunning ? "-80px" : "20px"}
      right={"20px"}
      zIndex={1001}
      onMouseEnter={() => !isRunning && !animationStarted && setIsExpanded(true)}
      onMouseLeave={() => {
        if (!showDropdown) {
          setIsExpanded(false);
        }
      }}
      transition={"right 1s ease"}
    >
      {/* Dropdown Menu */}
      {showDropdown && (
        <Box
          position="absolute"
          top="0px"
          right="1"
          w="220px"
          bg="white"
          borderRadius="xl"
          boxShadow="lg"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.200"
          zIndex={1000}
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
                  {t(algorithm.description)}
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
        bg={'purple.600'}
        borderRadius="full"
        boxShadow={'lg'}
        overflow="hidden"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        w={isExpanded ? '230px' : '60px'}
        opacity={0.7}
        pointerEvents={'auto'}
      >
        {/* Algorithm Name Section (extends to left) */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          px={4}
          h="full"
          w={"230px"}
          cursor={isRunning ? 'not-allowed' : 'pointer'}
          onClick={toggleDropdown}
          opacity={isExpanded ? 1 : 0}
          visibility={isExpanded ? 'visible' : 'hidden'}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            bg: isRunning ? 'transparent' : 'purple.700',
          }}
          whiteSpace="nowrap"
        >
          <Text
            color={"white"}
            fontSize="sm"
            fontWeight="500"
          >
            {t(currentAlgorithm?.name || 'SelectAlgorithm')}
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
          cursor={isRunning && !animationStarted ? 'not-allowed' : 'pointer'}
          flexShrink={0}
          onClick={handlePlayClick}
          _hover={{
            bg: 'purple.700',
          }}
          colorPalette={"purple"}
          transition="background 0.2s"
          _active={{
            transform: 'scale(0.95)',
          }}
          opacity={0.7}
        >
          {
          isPaused || !isRunning ? (
            <Play
              size={24}
              fill="white"
              color="white"
              style={{ marginLeft: '3px' }}
            />
          ) : (
            <Pause
              size={24}
              fill="white"
              color="white"
              style={{ marginLeft: '3px' }}
            />
          )}
        </IconButton>
      </Box>
    </Box >
  );
};

export default PlayButton;
