import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, IconButton, Text } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingStep {
  selector: string | null;
  titleKey: string;
  descriptionKey: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: OnboardingStep[] = [
  { selector: null, titleKey: 'OnboardingWelcomeTitle', descriptionKey: 'OnboardingWelcomeText', placement: 'center' },
  { selector: '[data-tour="add-node"]', titleKey: 'OnboardingAddNodeTitle', descriptionKey: 'OnboardingAddNodeText', placement: 'left' },
  { selector: '[data-tour="add-edge"]', titleKey: 'OnboardingAddEdgeTitle', descriptionKey: 'OnboardingAddEdgeText', placement: 'left' },
  { selector: '[data-tour="play-button"]', titleKey: 'OnboardingPlayTitle', descriptionKey: 'OnboardingPlayText', placement: 'left' },
  { selector: '[data-tour="accessibility-button"]', titleKey: 'OnboardingAccessibilityTitle', descriptionKey: 'OnboardingAccessibilityText', placement: 'right' },
  { selector: '[data-tour="fullscreen-button"]', titleKey: 'OnboardingFullscreenTitle', descriptionKey: 'OnboardingFullscreenText', placement: 'right' },
  { selector: '[data-tour="sidebar-toggle"]', titleKey: 'OnboardingSidebarTitle', descriptionKey: 'OnboardingSidebarText', placement: 'right' },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const PADDING = 10;
const GAP = 16;
const MARGIN = 12;
const Z_INDEX = 3000;
const RING_Z_INDEX = Z_INDEX + 1;

const panelBg = { base: 'white', _dark: 'gray.900' };
const headingColor = { base: 'gray.800', _dark: 'gray.100' };
const bodyColor = { base: 'gray.600', _dark: 'gray.300' };
const ringColor = { base: 'blue.400', _dark: 'blue.300' };
const overlayBg = 'rgba(0, 0, 0, 0.6)';

const nativeLanguageLabels: Record<string, string> = {
  en: 'English',
  el: 'Ελληνικά',
};

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

const TOOLTIP_TRANSITION = 'top 0.35s ease, left 0.35s ease, transform 0.35s ease';
const HOLE_TRANSITION = 'top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease';

const getTooltipWidth = () => Math.min(320, window.innerWidth * 0.92);

const resolvePlacement = (placement: OnboardingStep['placement'], rect: Rect, tooltipWidth: number): OnboardingStep['placement'] => {
  if (placement !== 'left' && placement !== 'right') return placement;

  const needed = tooltipWidth + GAP + MARGIN;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  if (placement === 'left' && spaceLeft >= needed) return 'left';
  if (placement === 'right' && spaceRight >= needed) return 'right';
  if (spaceLeft >= needed) return 'left';
  if (spaceRight >= needed) return 'right';

  return rect.top + rect.height / 2 > window.innerHeight / 2 ? 'top' : 'bottom';
};

const getTooltipStyle = (placement: OnboardingStep['placement'], rect: Rect, tooltipWidth: number) => {
  if (placement === 'center') {
    return { top: `${rect.top}px`, left: `${rect.left}px`, transform: 'translate(-50%, -50%)' };
  }

  let left: number;
  if (placement === 'left') {
    left = rect.left - GAP - tooltipWidth;
  } else if (placement === 'right') {
    left = rect.right + GAP;
  } else {
    const rightHalf = rect.left + rect.width / 2 > window.innerWidth / 2;
    left = rightHalf ? rect.right - tooltipWidth : rect.left;
  }
  left = Math.min(Math.max(left, MARGIN), window.innerWidth - tooltipWidth - MARGIN);

  let top: number;
  let translateY = '0%';
  if (placement === 'top') {
    top = rect.top - GAP;
    translateY = '-100%';
  } else if (placement === 'bottom') {
    top = rect.bottom + GAP;
  } else {
    const lowerHalf = rect.top + rect.height / 2 > window.innerHeight / 2;
    top = lowerHalf ? rect.bottom : Math.max(rect.top, MARGIN);
    translateY = lowerHalf ? '-100%' : '0%';
  }

  return { top: `${top}px`, left: `${left}px`, transform: `translateY(${translateY})` };
};

const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
  const { t, i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[stepIndex];
  const languageOptions = useMemo(() => (i18n.store.data ? Object.keys(i18n.store.data) : []), [i18n.store.data]);

  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  const measure = useCallback(() => {
    if (!step.selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    if (isOpen) measure();
  }, [isOpen, measure]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Raise the real target above the backdrop instead of cutting an approximate hole
  // for it — it then shows through in its exact shape (a perfect circle for these
  // round buttons) and stays genuinely clickable.
  useEffect(() => {
    if (!isOpen || !step.selector) return;
    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) return;
    const previousZIndex = el.style.zIndex;
    el.style.zIndex = String(RING_Z_INDEX);
    return () => {
      el.style.zIndex = previousZIndex;
    };
  }, [isOpen, step]);

  if (!isOpen) return null;

  const isLastStep = stepIndex === steps.length - 1;

  const goNext = () => {
    if (isLastStep) onClose();
    else setStepIndex((i) => i + 1);
  };
  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));

  // A zero-size point at the viewport center for the welcome step, so the spotlight
  // has a starting position to animate from instead of popping in on step two.
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const effectiveRect: Rect = rect ?? { top: centerY, left: centerX, right: centerX, bottom: centerY, width: 0, height: 0 };

  const holeTop = Math.max(0, effectiveRect.top - PADDING);
  const holeLeft = Math.max(0, effectiveRect.left - PADDING);
  const holeBottom = effectiveRect.bottom + PADDING;
  const holeRight = effectiveRect.right + PADDING;

  const tooltipWidth = getTooltipWidth();
  const resolvedPlacement = resolvePlacement(step.placement, effectiveRect, tooltipWidth);

  return (
    <>
      <Box position="fixed" inset={0} bg={overlayBg} zIndex={Z_INDEX} />
      <Box
        position="fixed"
        top={`${holeTop}px`}
        left={`${holeLeft}px`}
        width={`${holeRight - holeLeft}px`}
        height={`${holeBottom - holeTop}px`}
        borderRadius="full"
        border="3px solid"
        borderColor={ringColor}
        boxShadow="0 0 16px rgba(59, 130, 246, 0.6)"
        pointerEvents="none"
        zIndex={RING_Z_INDEX}
        transition={HOLE_TRANSITION}
      />

      <Box
        position="fixed"
        {...getTooltipStyle(resolvedPlacement, effectiveRect, tooltipWidth)}
        width={`${tooltipWidth}px`}
        maxH="80vh"
        overflowY="auto"
        bg={panelBg}
        borderRadius="lg"
        boxShadow="2xl"
        p={5}
        zIndex={Z_INDEX + 2}
        transition={TOOLTIP_TRANSITION}
      >
        <IconButton
          aria-label={t('OnboardingSkip')}
          onClick={onClose}
          position="absolute"
          top={2}
          right={2}
          size="xs"
          variant="ghost"
          color={bodyColor}
        >
          <X size={14} />
        </IconButton>

        <Text fontSize="lg" fontWeight="600" color={headingColor} mb={2} pr={6}>
          {t(step.titleKey)}
        </Text>
        <Text fontSize="sm" color={bodyColor} lineHeight="1.5" mb={4}>
          {t(step.descriptionKey)}
        </Text>

        {stepIndex === 0 && (
          <HStack gap={2} mb={4}>
            {languageOptions.map((language) => (
              <Button
                key={language}
                size="xs"
                px={3}
                variant={i18n.language === language ? 'solid' : 'outline'}
                colorPalette="blue"
                onClick={() => i18n.changeLanguage(language)}
              >
                {nativeLanguageLabels[language] ?? language}
              </Button>
            ))}
          </HStack>
        )}

        <HStack justify="space-between" align="center">
          <HStack gap="6px">
            {steps.map((_, i) => (
              <Box
                key={i}
                w="6px"
                h="6px"
                borderRadius="full"
                bg={i === stepIndex ? 'blue.500' : { base: 'gray.300', _dark: 'gray.600' }}
              />
            ))}
          </HStack>
          <HStack gap={2}>
            {stepIndex > 0 && (
              <Button size="sm" px={4} flexShrink={0} variant="ghost" onClick={goPrev}>
                {t('OnboardingBack')}
              </Button>
            )}
            <Button size="sm" px={4} flexShrink={0} colorPalette="blue" onClick={goNext}>
              {isLastStep ? t('OnboardingFinish') : t('OnboardingNext')}
            </Button>
          </HStack>
        </HStack>
      </Box>
    </>
  );
};

export default OnboardingTour;
